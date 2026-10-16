import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ApiException } from '../common/api-error.js';
import {
  requireDonorProfile,
  toDateInput,
} from '../common/inputs.js';
import { listMeta, pageParams } from '../common/pagination.js';
import { hasPermission } from '../auth/permissions.guard.js';
import type {
  AppointmentModel,
  RoleModel,
  UserModel,
} from '../generated/prisma/models.js';
import {
  CreateAppointmentDto,
  ListAppointmentsQueryDto,
  UpdateAppointmentDto,
} from './dto.js';

const APPOINTMENT_INCLUDE = {
  request: {
    select: {
      id: true,
      bloodGroup: true,
      urgency: true,
      status: true,
      city: true,
      hospitalName: true,
      createdByUserId: true,
    },
  },
  donor: {
    select: {
      id: true,
      user: { select: { id: true, name: true, image: true } },
    },
  },
  donation: { select: { id: true, status: true } },
} as const;

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Schedule a donation appointment — donor books for themselves. */
  async create(dto: CreateAppointmentDto, user: UserModel) {
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
        'This request is no longer accepting appointments',
      );
    }

    const scheduledAt = new Date(dto.scheduledAt);
    if (scheduledAt.getTime() <= Date.now()) {
      throw new ApiException(
        400,
        'VALIDATION_ERROR',
        'Appointment must be scheduled in the future',
      );
    }

    return this.prisma.appointment.create({
      data: {
        requestId: dto.requestId,
        donorProfileId: donor.id,
        donationId: dto.donationId,
        scheduledAt,
        location: dto.location,
        notes: dto.notes,
      },
      include: APPOINTMENT_INCLUDE,
    });
  }

  /** The caller's own appointments. */
  async listMine(query: ListAppointmentsQueryDto, user: UserModel) {
    const donor = await this.prisma.donorProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!donor) return { data: [], meta: listMeta(0, 1, 20) };

    const { skip, take, page, limit } = pageParams(query);
    const where = {
      donorProfileId: donor.id,
      ...(query.status ? { status: query.status } : {}),
      ...(query.requestId ? { requestId: query.requestId } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        orderBy: { scheduledAt: 'asc' },
        skip,
        take,
        include: APPOINTMENT_INCLUDE,
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return { data, meta: listMeta(total, page, limit) };
  }

  /** Appointments on a request — owner or admin. */
  async listForRequest(
    requestId: string,
    query: ListAppointmentsQueryDto,
    user: UserModel,
    role: RoleModel | null,
  ) {
    const request = await this.prisma.bloodRequest.findUnique({
      where: { id: requestId },
      select: { createdByUserId: true },
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
        'Only the request owner can view its appointments',
      );
    }

    const { skip, take, page, limit } = pageParams(query);
    const where = {
      requestId,
      ...(query.status ? { status: query.status } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        orderBy: { scheduledAt: 'asc' },
        skip,
        take,
        include: APPOINTMENT_INCLUDE,
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return { data, meta: listMeta(total, page, limit) };
  }

  /** Reschedule / update status — donor (own) or admin. */
  async update(
    id: string,
    dto: UpdateAppointmentDto,
    user: UserModel,
    role: RoleModel | null,
  ) {
    const appointment = await this.load(id);
    this.assertCanManage(appointment, user, role);

    return this.prisma.appointment.update({
      where: { id },
      data: {
        status: dto.status,
        scheduledAt: toDateInput(dto.scheduledAt) ?? undefined,
        location: dto.location,
        notes: dto.notes,
      },
      include: APPOINTMENT_INCLUDE,
    });
  }

  /** Cancel = status CANCELLED (donor own or admin). */
  async cancel(id: string, user: UserModel, role: RoleModel | null) {
    const appointment = await this.load(id);
    this.assertCanManage(appointment, user, role);

    return this.prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: APPOINTMENT_INCLUDE,
    });
  }

  private async load(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: { donor: { select: { userId: true } } },
    });
    if (!appointment) {
      throw new ApiException(
        404,
        'APPOINTMENT_NOT_FOUND',
        'Appointment not found',
      );
    }
    return appointment;
  }

  private assertCanManage(
    appointment: AppointmentModel & { donor: { userId: string } },
    user: UserModel,
    role: RoleModel | null,
  ) {
    if (
      appointment.donor.userId === user.id ||
      hasPermission(user, role, 'users', 'update')
    ) {
      return;
    }
    throw new ApiException(
      403,
      'FORBIDDEN',
      'You cannot modify this appointment',
    );
  }
}
