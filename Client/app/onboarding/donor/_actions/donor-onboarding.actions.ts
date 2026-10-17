import { profilesApi } from "@/api/profiles.api";
import type { DonorOnboardingFormValues } from "../_lib/donor-onboarding.schema";

const toIso = (val?: string) => {
  if (!val || !val.trim()) return undefined;
  const d = new Date(val);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
};

/**
 * Persists both halves of onboarding: the personal profile followed by the
 * donor profile. `isEligible` comes from the client-side evaluation — the
 * donor is only marked available when eligible AND opted in.
 */
export async function saveDonorOnboarding(
  formValues: DonorOnboardingFormValues,
  isEligible: boolean
) {
  await profilesApi.upsertPersonalProfile({
    dateOfBirth: toIso(formValues.dateOfBirth),
    gender: formValues.gender,
    phoneNumber: formValues.phoneNumber.trim() || undefined,
    maritalStatus: formValues.maritalStatus,
    addressLine: formValues.addressLine.trim() || undefined,
    city: formValues.city.trim() || undefined,
    district: formValues.district.trim() || undefined,
    state: formValues.state.trim() || undefined,
    pincode: formValues.pincode.trim() || undefined,
  });

  await profilesApi.upsertDonorProfile({
    bloodGroup: formValues.bloodGroup,
    heightCm: Number(formValues.heightCm),
    weightKg: Number(formValues.weightKg),
    donatedBefore: formValues.donatedBefore,
    previousDonationCount: formValues.donatedBefore
      ? Number(formValues.previousDonationCount)
      : 0,
    lastDonationDate: formValues.donatedBefore
      ? toIso(formValues.lastDonationDate)
      : undefined,
    takesMedication: formValues.takesMedication,
    medicationDetails: formValues.takesMedication
      ? formValues.medicationDetails
      : undefined,
    hasTattoo: formValues.hasTattoo,
    tattooDate: formValues.hasTattoo ? toIso(formValues.tattooDate) : undefined,
    hasSeriousMedicalCondition: formValues.hasSeriousMedicalCondition,
    medicalConditionDetails: formValues.hasSeriousMedicalCondition
      ? formValues.medicalConditionDetails
      : undefined,
    hasDiabetes: formValues.hasDiabetes,
    diabetesLevel: formValues.hasDiabetes
      ? formValues.diabetesLevel
      : undefined,
    hasHadSurgery: formValues.hasHadSurgery,
    lastSurgeryDate: formValues.hasHadSurgery
      ? toIso(formValues.lastSurgeryDate)
      : undefined,
    regularAlcoholUse: formValues.regularAlcoholUse,
    currentlyPregnant:
      formValues.gender === "FEMALE" ? formValues.currentlyPregnant : false,
    recentPregnancyOrDelivery:
      formValues.gender === "FEMALE"
        ? formValues.recentPregnancyOrDelivery
        : false,
    lastPregnancyDate:
      formValues.gender === "FEMALE" && formValues.recentPregnancyOrDelivery
        ? toIso(formValues.lastPregnancyDate)
        : undefined,
    isAvailable: isEligible && formValues.isAvailable,
    travelPreference: formValues.travelPreference,
    maxTravelDistanceKm: Number(formValues.maxTravelDistanceKm),
    contactPreference: formValues.contactPreference,
  });
}
