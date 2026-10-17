import type { DonorProfile, PersonalProfile } from "@/api/profiles.api";
import type { DonorOnboardingFormValues } from "./donor-onboarding.schema";

const toDateField = (value?: string | null) =>
  value ? value.slice(0, 10) : undefined;

/** Maps a saved personal profile onto the wizard's step-1 fields. */
export function mapPersonalProfileToForm(
  profile: PersonalProfile
): Partial<DonorOnboardingFormValues> {
  return {
    dateOfBirth: toDateField(profile.dateOfBirth),
    gender: profile.gender ?? undefined,
    phoneNumber: profile.phoneNumber ?? undefined,
    maritalStatus: profile.maritalStatus ?? undefined,
    addressLine: profile.addressLine ?? undefined,
    city: profile.city ?? undefined,
    district: profile.district ?? undefined,
    state: profile.state ?? undefined,
    pincode: profile.pincode ?? undefined,
  };
}

/** Maps a saved donor profile onto the wizard's step 2–5 fields. */
export function mapDonorProfileToForm(
  profile: DonorProfile
): Partial<DonorOnboardingFormValues> {
  return {
    bloodGroup: profile.bloodGroup ?? undefined,
    heightCm: profile.heightCm ?? undefined,
    weightKg: profile.weightKg ?? undefined,
    donatedBefore: profile.donatedBefore,
    previousDonationCount: profile.previousDonationCount,
    lastDonationDate: toDateField(profile.lastDonationDate),
    takesMedication: profile.takesMedication ?? undefined,
    medicationDetails: profile.medicationDetails ?? undefined,
    hasTattoo: profile.hasTattoo ?? undefined,
    tattooDate: toDateField(profile.tattooDate),
    hasSeriousMedicalCondition:
      profile.hasSeriousMedicalCondition ?? undefined,
    medicalConditionDetails: profile.medicalConditionDetails ?? undefined,
    hasDiabetes: profile.hasDiabetes ?? undefined,
    diabetesLevel:
      (profile.diabetesLevel as DonorOnboardingFormValues["diabetesLevel"]) ??
      undefined,
    hasHadSurgery: profile.hasHadSurgery ?? undefined,
    lastSurgeryDate: toDateField(profile.lastSurgeryDate),
    regularAlcoholUse: profile.regularAlcoholUse ?? undefined,
    currentlyPregnant: profile.currentlyPregnant ?? undefined,
    recentPregnancyOrDelivery:
      profile.recentPregnancyOrDelivery ?? undefined,
    lastPregnancyDate: toDateField(profile.lastPregnancyDate),
    isAvailable: profile.isAvailable,
    travelPreference: profile.travelPreference,
    maxTravelDistanceKm: profile.maxTravelDistanceKm ?? undefined,
    contactPreference: profile.contactPreference,
  };
}
