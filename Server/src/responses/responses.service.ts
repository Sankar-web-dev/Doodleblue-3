import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ApiException } from '../common/api-error.js';
import { requireDonorProfile, toDateInput } from '../common/inputs.js';
import { listMeta, pageParams } from '../common/pagination.js';
import { hasPermission } from '../auth/permissions.guard.js';
import type { RoleModel, UserModel } from '../generated/prisma/models.js';
import {
  CreateDonorResponseDto,
  ListResponsesQueryDto,
  UpdateDonorResponseDto,
} from './dto.js';

const RESPONSE_INCLUDE = {
  request: {
    select: {
      id: true,
      bloodGroup: true,
      component: true,
      urgency: true,
      status: true,
      city: true,
      state: true,
      hospitalName: true,
      patientName: true,
      createdByUserId: true,
    },
  },
  donor: {
    select: {
      id: true,
      bloodGroup: true,
      user: { select: { id: true, name: true, image: true } },
    },
  },
} as const;

@Injectable()
export class ResponsesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * A donor expresses interest in a blood request. Requires the caller's
   * donor profile and an open request; one response per donor per request.
   */
  async create(dto: CreateDonorResponseDto, user: UserModel) {
    const donor = await requireDonorProfile(this.prisma, user.id);

    const request = await this.prisma.bloodRequest.findUnique({
      where: { id: dto.requestId },
      select: { id: true, status: true },
    });
    if (!request) {
      throw new ApiException(
        404,
        'REQUEST_NOT_FOUND',
        'Blood request not found',
      );
    }
    if (request.status !== 'OPEN' && request.status !== 'PARTIALLY_FULFILLED') {
      throw new ApiException(
        409,
        'REQUEST_CLOSED',
        'This request is no longer accepting responses',
      );
    }

    const existing = await this.prisma.donorResponse.findUnique({
      where: {
        requestId_donorProfileId: {
          requestId: dto.requestId,
          donorProfileId: donor.id,
        },
      },
      select: { id: true },
    });
    if (existing) {
      throw new ApiException(
        409,
        'ALREADY_RESPONDED',
        'You have already responded to this request',
      );
    }

    return this.prisma.donorResponse.create({
      data: {
        requestId: dto.requestId,
        donorProfileId: donor.id,
        unitsOffered: dto.unitsOffered ?? 1,
        message: dto.message,
      },
      include: RESPONSE_INCLUDE,
    });
  }

  /** The caller's own responses. */
  async listMine(query: ListResponsesQueryDto, user: UserModel) {
    const donor = await this.prisma.donorProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!donor) return { data: [], meta: listMeta(0, 1, 20) };

    const { skip, take, page, limit } = pageParams(query);
    const where = {
      donorProfileId: donor.id,
      ...(query.status ? { status: query.status } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.donorResponse.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: RESPONSE_INCLUDE,
      }),
      this.prisma.donorResponse.count({ where }),
    ]);

    return { data, meta: listMeta(total, page, limit) };
  }

  /** Responses to a request — visible to the request's creator or admins. */
  async listForRequest(
    requestId: string,
    query: ListResponsesQueryDto,
    user: UserModel,
    role: RoleModel | null,
  ) {
    const request = await this.prisma.bloodRequest.findUnique({
      where: { id: requestId },
      select: { id: true, createdByUserId: true },
    });
    if (!request) {
      throw new ApiException(
        404,
        'REQUEST_NOT_FOUND',
        'Blood request not found',
      );
    }
    if (
      request.createdByUserId !== user.id &&
      !hasPermission(user, role, 'users', 'read')
    ) {
      throw new ApiException(
        403,
        'FORBIDDEN',
        'Only the request owner can view its responses',
      );
    }

    const { skip, take, page, limit } = pageParams(query);
    const where = {
      requestId,
      ...(query.status ? { status: query.status } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.donorResponse.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip,
        take,
        include: RESPONSE_INCLUDE,
      }),
      this.prisma.donorResponse.count({ where }),
    ]);

    return { data, meta: listMeta(total, page, limit) };
  }

  /**
   * Update a response. The responding donor may edit their message/units or
   * withdraw (DECLINED/CANCELLED); the request owner may advance status
   * (CONTACTED, APPOINTMENT_SCHEDULED, COMPLETED) and mark contactedAt.
   */
  async update(
    id: string,
    dto: UpdateDonorResponseDto,
    user: UserModel,
    role: RoleModel | null,
  ) {
    const response = await this.prisma.donorResponse.findUnique({
      where: { id },
      include: {
        request: { select: { createdByUserId: true } },
        donor: { select: { userId: true } },
      },
    });
    if (!response) {
      throw new ApiException(
        404,
        'RESPONSE_NOT_FOUND',
        'Donor response not found',
      );
    }

    const isDonor = response.donor.userId === user.id;
    const isRequestOwner =
      response.request.createdByUserId === user.id ||
      hasPermission(user, role, 'users', 'update');
    if (!isDonor && !isRequestOwner) {
      throw new ApiException(
        403,
        'FORBIDDEN',
        'You cannot modify this response',
      );
    }

    // Donors may only withdraw or edit their message/units.
    if (isDonor && !isRequestOwner) {
      if (
        dto.status &&
        dto.status !== 'DECLINED' &&
        dto.status !== 'CANCELLED'
      ) {
        throw new ApiException(
          403,
          'FORBIDDEN',
          'Donors can only withdraw their response',
        );
      }
    }

    return this.prisma.donorResponse.update({
      where: { id },
      data: {
        status: dto.status,
        unitsOffered: dto.unitsOffered,
        message: dto.message,
        contactedAt: toDateInput(dto.contactedAt),
      },
      include: RESPONSE_INCLUDE,
    });
  }

  /** Withdraw — donor deletes their own response (or admin). */
  async remove(id: string, user: UserModel, role: RoleModel | null) {
    const response = await this.prisma.donorResponse.findUnique({
      where: { id },
      select: { donor: { select: { userId: true } } },
    });
    if (!response) {
      throw new ApiException(
        404,
        'RESPONSE_NOT_FOUND',
        'Donor response not found',
      );
    }
    if (
      response.donor.userId !== user.id &&
      !hasPermission(user, role, 'users', 'delete')
    ) {
      throw new ApiException(
        403,
        'FORBIDDEN',
        'You cannot remove this response',
      );
    }
    await this.prisma.donorResponse.delete({ where: { id } });
  }
}
