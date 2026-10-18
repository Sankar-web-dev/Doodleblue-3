import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ApiException } from '../common/api-error.js';
import {
  assertDonorCanDonate,
  requireDonorProfile,
  toDateInput,
} from '../common/inputs.js';
import { listMeta, pageParams } from '../common/pagination.js';
import { hasPermission } from '../auth/permissions.guard.js';
import type {
  RoleModel,
  UserModel,
  DonationModel,
} from '../generated/prisma/models.js';
import {
  ListDonationsQueryDto,
  RegisterDonationDto,
  ReviewScreeningDto,
  UpdateDonationDto,
  UpsertScreeningDto,
} from './dto.js';

const DONATION_INCLUDE = {
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
      contactName: true,
      contactPhone: true,
      createdByUserId: true,
      creator: { select: { id: true, name: true } },
    },
  },
  donor: {
    select: {
      id: true,
      bloodGroup: true,
      userId: true,
      user: { select: { id: true, name: true, image: true } },
    },
  },
  verifiedBy: { select: { id: true, name: true } },
  screening: { select: { id: true, clinicalStatus: true } },
} as const;

@Injectable()
export class DonationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Register a donation against a request. Defaults to the caller's donor
   * profile; admins may register on behalf of another donor via
   * donorProfileId.
   */
  async register(
    dto: RegisterDonationDto,
    user: UserModel,
    role: RoleModel | null,
  ) {
    let donorProfileId = dto.donorProfileId;
    if (donorProfileId) {
      if (!hasPermission(user, role, 'users', 'update')) {
        throw new ApiException(
          403,
          'FORBIDDEN',
          'Only admins can register donations for other donors',
        );
      }
      const donor = await this.prisma.donorProfile.findUnique({
        where: { id: donorProfileId },
        select: { id: true, profileCompleted: true, isAvailable: true },
      });
      if (!donor) {
        throw new ApiException(
          404,
          'DONOR_NOT_FOUND',
          'Donor profile not found',
        );
      }
      assertDonorCanDonate(donor);
    } else {
      const donor = await requireDonorProfile(this.prisma, user.id);
      donorProfileId = donor.id;
    }

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

    return this.prisma.donation.create({
      data: {
        requestId: dto.requestId,
        donorProfileId,
        donationDate: toDateInput(dto.donationDate) ?? undefined,
        collectionLocation: dto.collectionLocation,
        notes: dto.notes,
        unitsDonated: dto.unitsDonated ?? 1,
      },
      include: DONATION_INCLUDE,
    });
  }

  /** The caller's own donation history. */
  async listMine(query: ListDonationsQueryDto, user: UserModel) {
    const donor = await this.prisma.donorProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!donor) return { data: [], meta: listMeta(0, 1, 20) };

    return this.listWhere({ donorProfileId: donor.id }, query);
  }

  /** Admin directory of all donations. */
  async listAll(query: ListDonationsQueryDto) {
    return this.listWhere({}, query);
  }

  private async listWhere(
    baseWhere: object,
    query: ListDonationsQueryDto,
  ) {
    const { skip, take, page, limit } = pageParams(query);
    const where = {
      ...baseWhere,
      ...(query.status ? { status: query.status } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.donation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: DONATION_INCLUDE,
      }),
      this.prisma.donation.count({ where }),
    ]);

    return { data, meta: listMeta(total, page, limit) };
  }

  async getById(id: string, user: UserModel, role: RoleModel | null) {
    const donation = await this.load(id);
    this.assertCanView(donation, user, role);
    return this.prisma.donation.findUnique({
      where: { id },
      include: DONATION_INCLUDE,
    });
  }

  /**
   * Update a donation. Completing a donation (status COMPLETED) rolls up:
   * request.unitsFulfilled, request status, and the donor's stats — in one
   * transaction.
   */
  async update(
    id: string,
    dto: UpdateDonationDto,
    user: UserModel,
    role: RoleModel | null,
  ) {
    const donation = await this.load(id);
    this.assertCanManage(donation, user, role);

    const completing =
      dto.status === 'COMPLETED' && donation.status !== 'COMPLETED';

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.donation.update({
        where: { id },
        data: {
          status: dto.status,
          donationDate:
            toDateInput(dto.donationDate) ??
            (completing ? new Date() : undefined),
          collectionLocation: dto.collectionLocation,
          notes: dto.notes,
          unitsDonated: dto.unitsDonated,
        },
        include: DONATION_INCLUDE,
      });

      if (completing) {
        const units = updated.unitsDonated;
        const request = await tx.bloodRequest.update({
          where: { id: updated.requestId },
          data: { unitsFulfilled: { increment: units } },
          select: { unitsRequired: true, unitsFulfilled: true },
        });
        await tx.bloodRequest.update({
          where: { id: updated.requestId },
          data: {
            status:
              request.unitsFulfilled >= request.unitsRequired
                ? 'FULFILLED'
                : 'PARTIALLY_FULFILLED',
          },
        });
        await tx.donorProfile.update({
          where: { id: updated.donorProfileId },
          data: {
            lastDonationDate: new Date(),
            previousDonationCount: { increment: 1 },
            donatedBefore: true,
          },
        });
      }

      return updated;
    });
  }

  /** Admin verification stamp on a completed donation. */
  async verify(id: string, user: UserModel, role: RoleModel | null) {
    const donation = await this.load(id);
    this.assertCanManage(donation, user, role);

    return this.prisma.donation.update({
      where: { id },
      data: { verifiedByUserId: user.id, verifiedAt: new Date() },
      include: DONATION_INCLUDE,
    });
  }

  // ---------------------------------------------------------------------
  // Donation-day screening
  // ---------------------------------------------------------------------

  /** Donor (or admin) submits/updates the pre-donation questionnaire. */
  async upsertScreening(
    donationId: string,
    dto: UpsertScreeningDto,
    user: UserModel,
    role: RoleModel | null,
  ) {
    const donation = await this.load(donationId);
    this.assertCanManage(donation, user, role);

    return this.prisma.donationScreening.upsert({
      where: { donationId },
      create: { donationId, ...dto },
      update: dto,
    });
  }

  async getScreening(
    donationId: string,
    user: UserModel,
    role: RoleModel | null,
  ) {
    const donation = await this.load(donationId);
    this.assertCanView(donation, user, role);
    return this.prisma.donationScreening.findUnique({
      where: { donationId },
    });
  }

  /** Clinical review of the screening — staff only (users:update). */
  async reviewScreening(
    donationId: string,
    dto: ReviewScreeningDto,
    user: UserModel,
    role: RoleModel | null,
  ) {
    if (!hasPermission(user, role, 'users', 'update')) {
      throw new ApiException(
        403,
        'FORBIDDEN',
        'Only clinical staff can review screenings',
      );
    }

    const screening = await this.prisma.donationScreening.findUnique({
      where: { donationId },
      select: { id: true },
    });
    if (!screening) {
      throw new ApiException(
        404,
        'SCREENING_NOT_FOUND',
        'No screening recorded for this donation',
      );
    }

    const reviewed = await this.prisma.donationScreening.update({
      where: { donationId },
      data: {
        clinicalStatus: dto.clinicalStatus,
        hivScreeningStatus: dto.hivScreeningStatus,
        deferUntil: toDateInput(dto.deferUntil),
        reviewerNotes: dto.reviewerNotes,
        reviewedByUserId: user.id,
        reviewedAt: new Date(),
      },
    });

    // A deferred/referred screening moves the donation back to DEFERRED.
    if (
      dto.clinicalStatus === 'DEFERRED' ||
      dto.clinicalStatus === 'REFERRED'
    ) {
      await this.prisma.donation.update({
        where: { id: donationId },
        data: { status: 'DEFERRED' },
      });
    }

    return reviewed;
  }

  // ---------------------------------------------------------------------

  private async load(id: string) {
    const donation = await this.prisma.donation.findUnique({
      where: { id },
      include: { donor: { select: { userId: true } } },
    });
    if (!donation) {
      throw new ApiException(
        404,
        'DONATION_NOT_FOUND',
        'Donation not found',
      );
    }
    return donation;
  }

  /** Donor themselves, the request creator, or users:update. */
  private assertCanManage(
    donation: DonationModel & { donor: { userId: string } },
    user: UserModel,
    role: RoleModel | null,
  ) {
    if (
      donation.donor.userId === user.id ||
      hasPermission(user, role, 'users', 'update')
    ) {
      return;
    }
    throw new ApiException(
      403,
      'FORBIDDEN',
      'You cannot modify this donation',
    );
  }

  private assertCanView(
    donation: DonationModel & { donor: { userId: string } },
    user: UserModel,
    role: RoleModel | null,
  ) {
    if (
      donation.donor.userId === user.id ||
      hasPermission(user, role, 'users', 'read')
    ) {
      return;
    }
    throw new ApiException(
      403,
      'FORBIDDEN',
      'You cannot view this donation',
    );
  }
}
