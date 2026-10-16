import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { assertUserExists, toDateInput } from '../common/inputs.js';
import { UpsertDonorProfileDto } from './dto.js';

@Injectable()
export class DonorProfileService {
  constructor(private readonly prisma: PrismaService) {}

  getForUser(userId: string) {
    return this.prisma.donorProfile.findUnique({ where: { userId } });
  }

  async upsertForUser(userId: string, dto: UpsertDonorProfileDto) {
    await assertUserExists(this.prisma, userId);

    const data = {
      bloodGroup: dto.bloodGroup,
      heightCm: dto.heightCm,
      weightKg: dto.weightKg,
      donatedBefore: dto.donatedBefore,
      previousDonationCount: dto.previousDonationCount,
      lastDonationDate: toDateInput(dto.lastDonationDate),
      takesMedication: dto.takesMedication,
      medicationDetails: dto.medicationDetails,
      hasTattoo: dto.hasTattoo,
      tattooDate: toDateInput(dto.tattooDate),
      hasSeriousMedicalCondition: dto.hasSeriousMedicalCondition,
      medicalConditionDetails: dto.medicalConditionDetails,
      hasDiabetes: dto.hasDiabetes,
      diabetesLevel: dto.diabetesLevel,
      hasHadSurgery: dto.hasHadSurgery,
      lastSurgeryDate: toDateInput(dto.lastSurgeryDate),
      regularAlcoholUse: dto.regularAlcoholUse,
      currentlyPregnant: dto.currentlyPregnant,
      recentPregnancyOrDelivery: dto.recentPregnancyOrDelivery,
      lastPregnancyDate: toDateInput(dto.lastPregnancyDate),
      isAvailable: dto.isAvailable,
      travelPreference: dto.travelPreference,
      maxTravelDistanceKm: dto.maxTravelDistanceKm,
      contactPreference: dto.contactPreference,
    };

    const existing = await this.getForUser(userId);
    const merged = { ...existing, ...data } as Record<string, unknown>;
    // Minimum donor data for a usable profile — health answers stay optional.
    const profileCompleted = Boolean(
      merged.bloodGroup && merged.heightCm && merged.weightKg,
    );

    return this.prisma.donorProfile.upsert({
      where: { userId },
      create: { userId, ...data, profileCompleted },
      update: { ...data, profileCompleted },
    });
  }
}
