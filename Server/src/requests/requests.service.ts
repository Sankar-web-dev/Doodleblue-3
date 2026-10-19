import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ApiException } from '../common/api-error.js';
import {
  assertOwnerOrUsersUpdate,
  toDateInput,
} from '../common/inputs.js';
import { listMeta, pageParams } from '../common/pagination.js';
import type { RoleModel, UserModel } from '../generated/prisma/models.js';
import {
  CreateBloodRequestDto,
  ListBloodRequestsQueryDto,
  UpdateBloodRequestDto,
} from './dto.js';

const REQUEST_INCLUDE = {
  creator: { select: { id: true, name: true, image: true } },
  recipientProfile: { select: { id: true } },
  bloodBankProfile: {
    select: { id: true, institutionName: true, city: true },
  },
  _count: { select: { responses: true, donations: true } },
} as const;

const BLOOD_GROUP_LABELS: Record<string, string> = {
  O_POSITIVE: 'O+',
  O_NEGATIVE: 'O-',
  A_POSITIVE: 'A+',
  A_NEGATIVE: 'A-',
  B_POSITIVE: 'B+',
  B_NEGATIVE: 'B-',
  AB_POSITIVE: 'AB+',
  AB_NEGATIVE: 'AB-',
  UNKNOWN: 'Any group',
};

const URGENCY_LABELS: Record<string, string> = {
  EMERGENCY: 'Emergency',
  WITHIN_24_HOURS: 'Needed within 24 hours',
  SCHEDULED: 'Scheduled requirement',
};

@Injectable()
export class RequestsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a blood request. RECIPIENT requests auto-link the caller's
   * recipient profile; BLOOD_BANK requests auto-link the caller's
   * institution profile.
   */
  async create(dto: CreateBloodRequestDto, user: UserModel) {
    let recipientProfileId: string | undefined;
    let bloodBankProfileId: string | undefined;

    if (dto.requestType === 'RECIPIENT') {
      const profile = await this.prisma.recipientProfile.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      recipientProfileId = profile?.id;
    } else {
      const profile = await this.prisma.bloodBankProfile.findUnique({
        where: { userId: user.id },
        select: { id: true, verificationStatus: true },
      });
      bloodBankProfileId = profile?.id;
    }

    const request = await this.prisma.bloodRequest.create({
      data: {
        requestType: dto.requestType,
        createdByUserId: user.id,
        recipientProfileId,
        bloodBankProfileId,
        bloodGroup: dto.bloodGroup,
        component: dto.component,
        unitsRequired: dto.unitsRequired,
        urgency: dto.urgency,
        requiredBy: toDateInput(dto.requiredBy) ?? undefined,
        expiresAt: toDateInput(dto.expiresAt) ?? undefined,
        patientName: dto.patientName,
        patientAge: dto.patientAge,
        relationshipToPatient: dto.relationshipToPatient,
        reason: dto.reason,
        hospitalName: dto.hospitalName,
        hospitalAddress: dto.hospitalAddress,
        city: dto.city,
        district: dto.district,
        state: dto.state,
        pincode: dto.pincode,
        latitude: dto.latitude,
        longitude: dto.longitude,
        contactName: dto.contactName,
        contactPhone: dto.contactPhone,
        notes: dto.notes,
      },
      include: REQUEST_INCLUDE,
    });

    await this.notifyDonors(request.id, dto, user.id);

    return request;
  }

  /**
   * In-app notification fan-out — every active donor (donor role or a donor
   * profile on file) hears about a new blood request.
   */
  private async notifyDonors(
    requestId: string,
    dto: CreateBloodRequestDto,
    creatorUserId: string,
  ) {
    const donors = await this.prisma.user.findMany({
      where: {
        isActive: true,
        id: { not: creatorUserId },
        OR: [
          { role: { contains: 'dona', mode: 'insensitive' } },
          { donorProfile: { isNot: null } },
        ],
      },
      select: { id: true },
    });
    if (donors.length === 0) return;

    const group = BLOOD_GROUP_LABELS[dto.bloodGroup] ?? dto.bloodGroup;
    const requiredBy = dto.requiredBy
      ? new Date(dto.requiredBy).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : null;

    await this.prisma.notification.createMany({
      data: donors.map((donor) => ({
        userId: donor.id,
        type: 'BLOOD_REQUEST',
        title: `${group} blood needed — ${dto.city}`,
        message:
          `${dto.unitsRequired} ${dto.unitsRequired === 1 ? 'unit' : 'units'} ` +
          `required${requiredBy ? ` by ${requiredBy}` : ''} — ` +
          `${URGENCY_LABELS[dto.urgency] ?? dto.urgency}`,
        link: `/notification/${requestId}`,
      })),
    });
  }

  /** Browse requests — any authenticated user; filterable directory. */
  async list(query: ListBloodRequestsQueryDto, user: UserModel) {
    const { skip, take, page, limit } = pageParams(query);

    const where = {
      ...(query.mine ? { createdByUserId: user.id } : {}),
      ...(query.requestType ? { requestType: query.requestType } : {}),
      ...(query.bloodGroup ? { bloodGroup: query.bloodGroup } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.urgency ? { urgency: query.urgency } : {}),
      ...(query.city
        ? { city: { contains: query.city, mode: 'insensitive' as const } }
        : {}),
      ...(query.search
        ? {
            OR: [
              {
                city: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                hospitalName: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                patientName: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                reason: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.bloodRequest.findMany({
        where,
        orderBy: [{ urgency: 'asc' }, { createdAt: 'desc' }],
        skip,
        take,
        include: REQUEST_INCLUDE,
      }),
      this.prisma.bloodRequest.count({ where }),
    ]);

    return { data, meta: listMeta(total, page, limit) };
  }

  async getById(id: string) {
    const request = await this.prisma.bloodRequest.findUnique({
      where: { id },
      include: {
        ...REQUEST_INCLUDE,
        responses: {
          orderBy: { createdAt: 'desc' },
          include: {
            donor: {
              select: {
                id: true,
                bloodGroup: true,
                user: { select: { id: true, name: true, image: true } },
              },
            },
          },
        },
      },
    });
    if (!request) {
      throw new ApiException(
        404,
        'REQUEST_NOT_FOUND',
        'Blood request not found',
      );
    }
    return request;
  }

  async update(
    id: string,
    dto: UpdateBloodRequestDto,
    user: UserModel,
    role: RoleModel | null,
  ) {
    const request = await this.getRaw(id);
    assertOwnerOrUsersUpdate(user, role, request.createdByUserId, 'requests');

    return this.prisma.bloodRequest.update({
      where: { id },
      data: {
        bloodGroup: dto.bloodGroup,
        component: dto.component,
        unitsRequired: dto.unitsRequired,
        urgency: dto.urgency,
        requiredBy: toDateInput(dto.requiredBy),
        expiresAt: toDateInput(dto.expiresAt),
        patientName: dto.patientName,
        patientAge: dto.patientAge,
        relationshipToPatient: dto.relationshipToPatient,
        reason: dto.reason,
        hospitalName: dto.hospitalName,
        hospitalAddress: dto.hospitalAddress,
        city: dto.city,
        district: dto.district,
        state: dto.state,
        pincode: dto.pincode,
        latitude: dto.latitude,
        longitude: dto.longitude,
        contactName: dto.contactName,
        contactPhone: dto.contactPhone,
        notes: dto.notes,
      },
      include: REQUEST_INCLUDE,
    });
  }

  /** Status transitions — owner or admin (CANCELLED, reOPEN, etc.). */
  async setStatus(
    id: string,
    status: 'OPEN' | 'PARTIALLY_FULFILLED' | 'FULFILLED' | 'CANCELLED' | 'EXPIRED',
    user: UserModel,
    role: RoleModel | null,
  ) {
    const request = await this.getRaw(id);
    assertOwnerOrUsersUpdate(user, role, request.createdByUserId, 'requests');

    return this.prisma.bloodRequest.update({
      where: { id },
      data: { status },
      include: REQUEST_INCLUDE,
    });
  }

  /** Soft-delete — requests are cancelled, never hard-deleted. */
  async cancel(id: string, user: UserModel, role: RoleModel | null) {
    return this.setStatus(id, 'CANCELLED', user, role);
  }

  private async getRaw(id: string) {
    const request = await this.prisma.bloodRequest.findUnique({
      where: { id },
    });
    if (!request) {
      throw new ApiException(
        404,
        'REQUEST_NOT_FOUND',
        'Blood request not found',
      );
    }
    return request;
  }
}
