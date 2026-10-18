import { profilesApi } from "@/api/profiles.api";
import type { RecipientOnboardingFormValues } from "../_lib/recipient-onboarding.schema";

const toIso = (val?: string) => {
  if (!val || !val.trim()) return undefined;
  const d = new Date(val);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
};

/**
 * Persists both halves of onboarding: the shared personal profile followed by
 * the recipient profile. `relationshipToPatient` is only sent when the user
 * registers on behalf of someone else — the server computes `profileCompleted`.
 */
export async function saveRecipientOnboarding(
  formValues: RecipientOnboardingFormValues
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
    latitude: formValues.latitude,
    longitude: formValues.longitude,
  });

  await profilesApi.upsertRecipientProfile({
    registrationFor: formValues.registrationFor,
    relationshipToPatient:
      formValues.registrationFor === "SOMEONE_ELSE"
        ? formValues.relationshipToPatient.trim()
        : undefined,
  });
}
