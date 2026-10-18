import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { assertUserExists, toDateInput } from '../common/inputs.js';
import { UpsertPersonalProfileDto } from './dto.js';

@Injectable()
export class PersonalProfileService {
  constructor(private readonly prisma: PrismaService) {}

  getForUser(userId: string) {
    return this.prisma.personalProfile.findUnique({ where: { userId } });
  }

  async upsertForUser(userId: string, dto: UpsertPersonalProfileDto) {
    await assertUserExists(this.prisma, userId);

    const data = {
      dateOfBirth: toDateInput(dto.dateOfBirth),
      gender: dto.gender,
      phoneNumber: dto.phoneNumber,
      maritalStatus: dto.maritalStatus,
      addressLine: dto.addressLine,
      city: dto.city,
      district: dto.district,
      state: dto.state,
      pincode: dto.pincode,
      latitude: dto.latitude,
      longitude: dto.longitude,
    };

    // Merged view used to recompute completeness after the write.
    const existing = await this.getForUser(userId);
    const merged = { ...existing, ...data } as Record<string, unknown>;
    const profileCompleted = Boolean(
      merged.dateOfBirth &&
        merged.gender &&
        merged.phoneNumber &&
        merged.city &&
        merged.state &&
        merged.pincode,
    );

    return this.prisma.personalProfile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }
}
