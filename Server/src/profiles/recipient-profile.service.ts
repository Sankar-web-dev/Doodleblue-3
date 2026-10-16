import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { assertUserExists } from '../common/inputs.js';
import { UpsertRecipientProfileDto } from './dto.js';

@Injectable()
export class RecipientProfileService {
  constructor(private readonly prisma: PrismaService) {}

  getForUser(userId: string) {
    return this.prisma.recipientProfile.findUnique({ where: { userId } });
  }

  async upsertForUser(userId: string, dto: UpsertRecipientProfileDto) {
    await assertUserExists(this.prisma, userId);

    const data = {
      registrationFor: dto.registrationFor,
      relationshipToPatient: dto.relationshipToPatient,
    };

    const existing = await this.getForUser(userId);
    const merged = { ...existing, ...data } as Record<string, unknown>;
    const profileCompleted =
      merged.registrationFor === 'SOMEONE_ELSE'
        ? Boolean(merged.relationshipToPatient)
        : Boolean(merged.registrationFor);

    return this.prisma.recipientProfile.upsert({
      where: { userId },
      create: { userId, ...data, profileCompleted },
      update: { ...data, profileCompleted },
    });
  }
}
