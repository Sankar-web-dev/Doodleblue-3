import type { BloodBankProfile } from "@/api/profiles.api";
import type { BloodBankOnboardingFormValues } from "./blood-bank-onboarding.schema";

/** Maps a saved blood bank profile onto the wizard's fields. */
export function mapBloodBankProfileToForm(
  profile: BloodBankProfile
): Partial<BloodBankOnboardingFormValues> {
  return {
    institutionName: profile.institutionName ?? undefined,
    hospitalType: profile.hospitalType ?? undefined,
    hospitalPhone: profile.hospitalPhone ?? undefined,
    website: profile.website ?? undefined,
    registrationNumber: profile.registrationNumber ?? undefined,
    contactPersonName: profile.contactPersonName ?? undefined,
    contactDesignation: profile.contactDesignation ?? undefined,
    contactPhone: profile.contactPhone ?? undefined,
    officialEmail: profile.officialEmail ?? undefined,
    addressLine: profile.addressLine ?? undefined,
    city: profile.city ?? undefined,
    district: profile.district ?? undefined,
    state: profile.state ?? undefined,
    pincode: profile.pincode ?? undefined,
  };
}
