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
import { MailerService } from '../mail/mailer.service.js';


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
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  },
  donation: { select: { id: true, status: true } },
} as const;

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: MailerService,
  ) {}

  /**
   * Schedule a donation appointment — a donor books for themselves, or the
   * request owner/admin schedules on a donor's behalf via `donorProfileId`.
   */
  async create(
    dto: CreateAppointmentDto,
    user: UserModel,
    role: RoleModel | null,
  ) {
    const request = await this.prisma.bloodRequest.findUnique({
      where: { id: dto.requestId },
      select: {
        id: true,
        status: true,
        createdByUserId: true,
        hospitalName: true,
        city: true,
      },
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

    const onBehalfOfDonor = !!dto.donorProfileId;
    let donorProfileId: string;
    let donorUserId: string;
    if (onBehalfOfDonor) {
      // Only the request owner or an admin may schedule for a donor.
      if (
        request.createdByUserId !== user.id &&
        !hasPermission(user, role, 'appointments', 'update')
      ) {
        throw new ApiException(
          403,
          'FORBIDDEN',
          'Only the request owner can schedule for a donor',
        );
      }
      const donor = await this.prisma.donorProfile.findUnique({
        where: { id: dto.donorProfileId },
        select: { id: true, userId: true },
      });
      if (!donor) {
        throw new ApiException(
          404,
          'DONOR_NOT_FOUND',
          'Donor profile not found',
        );
      }
      donorProfileId = donor.id;
      donorUserId = donor.userId;
    } else {
      const donor = await requireDonorProfile(this.prisma, user.id);
      donorProfileId = donor.id;
      donorUserId = user.id;
    }

    const scheduledAt = new Date(dto.scheduledAt);
    if (scheduledAt.getTime() <= Date.now()) {
      throw new ApiException(
        400,
        'VALIDATION_ERROR',
        'Appointment must be scheduled in the future',
      );
    }

    const when = scheduledAt.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
    const where = dto.location ?? request.hospitalName ?? request.city;

    return this.prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.create({
        data: {
          requestId: dto.requestId,
          donorProfileId,
          donationId: dto.donationId,
          scheduledAt,
          location: dto.location,
          notes: dto.notes,
        },
        include: APPOINTMENT_INCLUDE,
      });

      // Owner-scheduled: advance the donor's response to APPOINTMENT_SCHEDULED.
      if (onBehalfOfDonor) {
        await tx.donorResponse.updateMany({
          where: {
            requestId: dto.requestId,
            donorProfileId,
            status: { in: ['INTERESTED', 'CONTACTED'] },
          },
          data: { status: 'APPOINTMENT_SCHEDULED', contactedAt: new Date() },
        });
      }

      await tx.notification.create({
        data: {
          userId: donorUserId,
          type: 'APPOINTMENT',
          title: 'Donation appointment scheduled',
          message: `Your donation slot is ${when}${where ? ` at ${where}` : ''}.`,
          link: '/appointments',
        },
      });

      // Send appointment confirmation email
      const donorUser = appointment.donor?.user;
      if (donorUser?.email) {
        void this.mailer.sendAppointmentConfirmation({
          to: donorUser.email,
          name: donorUser.name ?? 'Donor',
          appointmentDetails: {
            date: when,
            location: where ?? undefined,
            requestId: dto.requestId,
          },
        });
      }

      return appointment;
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

  /** Appointments across all of the caller's own requests (blood bank). */
  async listOwned(query: ListAppointmentsQueryDto, user: UserModel) {
    const { skip, take, page, limit } = pageParams(query);
    const where = {
      request: { createdByUserId: user.id },
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
      !hasPermission(user, role, 'appointments', 'read')
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
      include: {
        donor: { select: { userId: true } },
        request: { select: { createdByUserId: true } },
      },
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
    appointment: AppointmentModel & {
      donor: { userId: string };
      request: { createdByUserId: string };
    },
    user: UserModel,
    role: RoleModel | null,
  ) {
    if (
      appointment.donor.userId === user.id ||
      appointment.request.createdByUserId === user.id ||
      hasPermission(user, role, 'appointments', 'update')
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
