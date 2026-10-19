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
      requestType: true,
      createdByUserId: true,
    },
  },
  donor: {
    select: {
      id: true,
      bloodGroup: true,
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          email: true,
          personalProfile: { select: { phoneNumber: true } },
        },
      },
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
      select: {
        id: true,
        status: true,
        createdByUserId: true,
        bloodGroup: true,
        requestType: true,
        patientName: true,
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

    const created = await this.prisma.donorResponse.create({
      data: {
        requestId: dto.requestId,
        donorProfileId: donor.id,
        unitsOffered: dto.unitsOffered ?? 1,
        message: dto.message,
      },
      include: RESPONSE_INCLUDE,
    });

    // Carry the pledge onto any in-progress donation record (e.g. one
    // created at screening time) so it reflects the offered units until
    // the actual donation is completed.
    await this.prisma.donation.updateMany({
      where: {
        requestId: dto.requestId,
        donorProfileId: donor.id,
        status: { not: 'COMPLETED' },
      },
      data: { unitsDonated: dto.unitsOffered ?? 1 },
    });

    // Notify request creator (Recipient or Blood Bank)
    if (request.createdByUserId && request.createdByUserId !== user.id) {
      const group = BLOOD_GROUP_LABELS[request.bloodGroup] ?? request.bloodGroup;
      const isRecipient = request.requestType === 'RECIPIENT';
      const context =
        isRecipient && request.patientName
          ? `for ${request.patientName}`
          : request.hospitalName
            ? `at ${request.hospitalName}`
            : `in ${request.city}`;
      const unitsText = `${dto.unitsOffered ?? 1} ${(dto.unitsOffered ?? 1) === 1 ? 'unit' : 'units'}`;

      await this.prisma.notification.create({
        data: {
          userId: request.createdByUserId,
          type: 'DONOR_RESPONSE',
          title: `New donor response — ${group}`,
          message: `${user.name} offered ${unitsText} of ${group} blood (${context})${dto.message ? `: "${dto.message}"` : ''}`,
          link: `/requests?responses=${request.id}`,
        },
      });
    }

    return created;
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
      !hasPermission(user, role, 'responses', 'read')
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
        request: {
          select: {
            id: true,
            createdByUserId: true,
            bloodGroup: true,
            patientName: true,
            hospitalName: true,
            city: true,
            requestType: true,
            unitsRequired: true,
            unitsFulfilled: true,
            creator: { select: { name: true } },
          },
        },
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
      hasPermission(user, role, 'responses', 'update');
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

    const completing =
      isRequestOwner &&
      dto.status === 'COMPLETED' &&
      response.status !== 'COMPLETED';
    const unitsToFulfill = dto.unitsOffered ?? response.unitsOffered ?? 1;

    let updatedRequestData: {
      id: string;
      unitsRequired: number;
      unitsFulfilled: number;
      remaining: number;
    } | null = null;

    const updated = await this.prisma.$transaction(async (tx) => {
      const resp = await tx.donorResponse.update({
        where: { id },
        data: {
          status: dto.status,
          unitsOffered: dto.unitsOffered,
          message: dto.message,
          contactedAt: toDateInput(dto.contactedAt) ?? (completing ? new Date() : undefined),
        },
        include: RESPONSE_INCLUDE,
      });

      // Keep in-progress donation records in step with the pledge.
      if (!completing && dto.unitsOffered !== undefined) {
        await tx.donation.updateMany({
          where: {
            requestId: response.requestId,
            donorProfileId: response.donorProfileId,
            status: { not: 'COMPLETED' },
          },
          data: { unitsDonated: dto.unitsOffered },
        });
      }

      if (completing) {
        // 1. Create or update Donation record without duplicates
        const existingDonations = await tx.donation.findMany({
          where: {
            requestId: response.requestId,
            donorProfileId: response.donorProfileId,
          },
          orderBy: { createdAt: 'desc' },
        });

        if (existingDonations.length > 0) {
          const primary = existingDonations[0];
          await tx.donation.update({
            where: { id: primary.id },
            data: {
              status: 'COMPLETED',
              unitsDonated: unitsToFulfill,
              donationDate: new Date(),
              collectionLocation:
                response.request.hospitalName || response.request.city,
            },
          });
          // Clean up any extra duplicate draft records
          if (existingDonations.length > 1) {
            const extraIds = existingDonations.slice(1).map((d) => d.id);
            await tx.donation.deleteMany({
              where: { id: { in: extraIds } },
            });
          }
        } else {
          await tx.donation.create({
            data: {
              requestId: response.requestId,
              donorProfileId: response.donorProfileId,
              status: 'COMPLETED',
              unitsDonated: unitsToFulfill,
              donationDate: new Date(),
              collectionLocation:
                response.request.hospitalName || response.request.city,
              notes: response.message ? `Response: ${response.message}` : null,
            },
          });
        }

        // 2. Increment request unitsFulfilled and update request status
        const currentReq = await tx.bloodRequest.findUnique({
          where: { id: response.requestId },
          select: { unitsRequired: true, unitsFulfilled: true },
        });

        if (currentReq) {
          const newFulfilled = currentReq.unitsFulfilled + unitsToFulfill;
          const isFullyFulfilled = newFulfilled >= currentReq.unitsRequired;
          const remaining = Math.max(0, currentReq.unitsRequired - newFulfilled);

          await tx.bloodRequest.update({
            where: { id: response.requestId },
            data: {
              unitsFulfilled: newFulfilled,
              status: isFullyFulfilled ? 'FULFILLED' : 'PARTIALLY_FULFILLED',
            },
          });

          updatedRequestData = {
            id: response.requestId,
            unitsRequired: currentReq.unitsRequired,
            unitsFulfilled: newFulfilled,
            remaining,
          };
        }

        // 3. Update DonorProfile stats
        await tx.donorProfile.update({
          where: { id: response.donorProfileId },
          data: {
            previousDonationCount: { increment: 1 },
            lastDonationDate: new Date(),
            donatedBefore: true,
          },
        });
      }

      return resp;
    });

    // Notify donor when request owner advances status
    if (isRequestOwner && dto.status && dto.status !== response.status) {
      const targetLabel =
        response.request.patientName ||
        response.request.hospitalName ||
        'blood request';
      let msg = `Your response status has been updated to ${dto.status}.`;
      let link = '/responses';

      if (dto.status === 'CONTACTED') {
        msg = `The coordinator for ${targetLabel} has reviewed your response and marked you as contacted.`;
      } else if (dto.status === 'APPOINTMENT_SCHEDULED') {
        msg = `An appointment has been scheduled for your donation (${targetLabel}).`;
      } else if (dto.status === 'COMPLETED') {
        msg = `Your donation of ${unitsToFulfill} ${unitsToFulfill === 1 ? 'unit' : 'units'} for ${targetLabel} has been confirmed. Thank you for saving a life!`;
        link = '/donations';
      } else if (dto.status === 'DECLINED') {
        msg = `Your response for ${targetLabel} could not be accommodated at this time.`;
      }

      await this.prisma.notification.create({
        data: {
          userId: response.donor.userId,
          type: 'REQUEST_UPDATE',
          title: `Response update — ${targetLabel}`,
          message: msg,
          link,
        },
      });
    }

    // Broadcast update to all other eligible donors when donation is completed
    if (completing && updatedRequestData) {
      const reqData = updatedRequestData as {
        id: string;
        unitsRequired: number;
        unitsFulfilled: number;
        remaining: number;
      };
      const group =
        BLOOD_GROUP_LABELS[response.request.bloodGroup] ??
        response.request.bloodGroup;
      const recipientName =
        response.request.creator?.name || 'The recipient';
      const targetDesc = response.request.patientName
        ? `for ${response.request.patientName}`
        : response.request.hospitalName
          ? `at ${response.request.hospitalName}`
          : '';

      const otherDonors = await this.prisma.user.findMany({
        where: {
          isActive: true,
          id: {
            notIn: [
              user.id,
              response.donor.userId,
              response.request.createdByUserId,
            ],
          },
          OR: [
            { role: { contains: 'dona', mode: 'insensitive' } },
            { donorProfile: { isNot: null } },
          ],
        },
        select: { id: true },
      });

      if (otherDonors.length > 0) {
        if (reqData.remaining > 0) {
          await this.prisma.notification.createMany({
            data: otherDonors.map((d) => ({
              userId: d.id,
              type: 'REQUEST_UPDATE',
              title: `Update: ${reqData.remaining} ${reqData.remaining === 1 ? 'unit' : 'units'} needed — ${group}`,
              message: `${recipientName} has received ${unitsToFulfill} ${unitsToFulfill === 1 ? 'unit' : 'units'}. ${reqData.remaining} ${reqData.remaining === 1 ? 'unit is' : 'units are'} still urgently needed ${targetDesc}. Can you help?`,
              link: `/notification/${response.requestId}`,
            })),
          });
        } else {
          await this.prisma.notification.createMany({
            data: otherDonors.map((d) => ({
              userId: d.id,
              type: 'REQUEST_UPDATE',
              title: `Request Fulfilled — ${group}`,
              message: `All ${reqData.unitsRequired} units have been fulfilled ${targetDesc}. Thank you to all donors who stepped forward!`,
              link: `/notification/${response.requestId}`,
            })),
          });
        }
      }
    }

    // Notify request owner if donor withdraws
    if (
      isDonor &&
      (dto.status === 'CANCELLED' || dto.status === 'DECLINED') &&
      response.request.createdByUserId &&
      response.request.createdByUserId !== user.id
    ) {
      await this.prisma.notification.create({
        data: {
          userId: response.request.createdByUserId,
          type: 'DONOR_RESPONSE',
          title: 'Donor response withdrawn',
          message: `${user.name} withdrew their response for the blood request.`,
          link: `/requests?responses=${response.request.id}`,
        },
      });
    }

    return updated;
  }

  /** Withdraw — donor deletes their own response (or admin). */
  async remove(id: string, user: UserModel, role: RoleModel | null) {
    const response = await this.prisma.donorResponse.findUnique({
      where: { id },
      select: {
        donor: { select: { userId: true } },
        request: { select: { id: true, createdByUserId: true } },
      },
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
      !hasPermission(user, role, 'responses', 'delete')
    ) {
      throw new ApiException(
        403,
        'FORBIDDEN',
        'You cannot remove this response',
      );
    }
    await this.prisma.donorResponse.delete({ where: { id } });

    // Notify request owner if donor withdraws/deletes response
    if (
      response.request.createdByUserId &&
      response.request.createdByUserId !== user.id
    ) {
      await this.prisma.notification.create({
        data: {
          userId: response.request.createdByUserId,
          type: 'DONOR_RESPONSE',
          title: 'Donor response withdrawn',
          message: `${user.name} withdrew their response for the blood request.`,
          link: `/requests?responses=${response.request.id}`,
        },
      });
    }
  }
}
