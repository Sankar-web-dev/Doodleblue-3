import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { VerificationStatus } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { listMeta, pageParams } from '../common/pagination.js';
import { ApiException } from '../common/api-error.js';
import { assertUserExists } from '../common/inputs.js';
import {
  ListBloodBanksQueryDto,
  UpsertBloodBankProfileDto,
  VerifyBloodBankDto,
} from './dto.js';

const REQUIRED_ON_CREATE: (keyof UpsertBloodBankProfileDto)[] = [
  'institutionName',
  'hospitalPhone',
  'contactPersonName',
  'contactPhone',
  'addressLine',
  'city',
  'district',
  'state',
  'pincode',
];

@Injectable()
export class BloodBankProfileService {
  constructor(private readonly prisma: PrismaService) {}

  getForUser(userId: string) {
    return this.prisma.bloodBankProfile.findUnique({ where: { userId } });
  }

  async upsertForUser(userId: string, dto: UpsertBloodBankProfileDto) {
    await assertUserExists(this.prisma, userId);

    const existing = await this.getForUser(userId);
    const merged = { ...existing, ...dto } as Record<string, unknown>;

    if (!existing) {
      const missing = REQUIRED_ON_CREATE.filter((k) => !merged[k]);
      if (missing.length > 0) {
        throw new ApiException(
          400,
          'VALIDATION_ERROR',
          `Missing required fields: ${missing.join(', ')}`,
        );
      }
    }

    // Editing institution details resets verification to PENDING.
    const data = {
      ...dto,
      ...(existing
        ? { verificationStatus: VerificationStatus.PENDING }
        : {}),
    };

    return this.prisma.bloodBankProfile.upsert({
      where: { userId },
      // Required fields were validated above on the create path.
      create: {
        userId,
        ...data,
      } as Prisma.BloodBankProfileUncheckedCreateInput,
      update: data,
    });
  }

  /** Admin list — filterable, paginated bank/institution directory. */
  async list(query: ListBloodBanksQueryDto) {
    const { skip, take, page, limit } = pageParams(query);

    const where = {
      ...(query.status ? { verificationStatus: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { institutionName: { contains: query.search, mode: 'insensitive' as const } },
              { city: { contains: query.search, mode: 'insensitive' as const } },
              { district: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.bloodBankProfile.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          user: { select: { id: true, name: true, email: true } },
          verifiedBy: { select: { id: true, name: true } },
        },
      }),
      this.prisma.bloodBankProfile.count({ where }),
    ]);

    return { data, meta: listMeta(total, page, limit) };
  }

  /** Admin verification decision on a blood bank profile. */
  async verify(id: string, dto: VerifyBloodBankDto, actorUserId: string) {
    const existing = await this.prisma.bloodBankProfile.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      throw new ApiException(
        404,
        'BLOOD_BANK_NOT_FOUND',
        'Blood bank profile not found',
      );
    }

    return this.prisma.bloodBankProfile.update({
      where: { id },
      data: {
        verificationStatus: dto.status,
        verificationNotes: dto.notes,
        verifiedAt: dto.status === VerificationStatus.VERIFIED ? new Date() : null,
        verifiedByUserId:
          dto.status === VerificationStatus.VERIFIED ? actorUserId : null,
      },
    });
  }
}
