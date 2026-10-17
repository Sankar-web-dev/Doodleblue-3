import type { PersonalProfile, RecipientProfile } from "@/api/profiles.api";
import type { RecipientOnboardingFormValues } from "./recipient-onboarding.schema";

const toDateField = (value?: string | null) =>
  value ? value.slice(0, 10) : undefined;

/** Maps a saved personal profile onto the wizard's step-1 fields. */
export function mapPersonalProfileToForm(
  profile: PersonalProfile
): Partial<RecipientOnboardingFormValues> {
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

/** Maps a saved recipient profile onto the wizard's step-2 fields. */
export function mapRecipientProfileToForm(
  profile: RecipientProfile
): Partial<RecipientOnboardingFormValues> {
  return {
    registrationFor: profile.registrationFor ?? undefined,
    relationshipToPatient: profile.relationshipToPatient ?? undefined,
  };
}
