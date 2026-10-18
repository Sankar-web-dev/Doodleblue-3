import { profilesApi } from "@/api/profiles.api";
import type { BloodBankOnboardingFormValues } from "../_lib/blood-bank-onboarding.schema";

/**
 * Persists the blood bank profile. Saving resets the institution's
 * verification status to PENDING on the server.
 */
export async function saveBloodBankOnboarding(
  formValues: BloodBankOnboardingFormValues
) {
  await profilesApi.upsertBloodBankProfile({
    institutionName: formValues.institutionName.trim(),
    hospitalType: formValues.hospitalType,
    hospitalPhone: formValues.hospitalPhone.trim(),
    website: formValues.website.trim() || undefined,
    registrationNumber: formValues.registrationNumber.trim() || undefined,
    contactPersonName: formValues.contactPersonName.trim(),
    contactDesignation: formValues.contactDesignation,
    contactPhone: formValues.contactPhone.trim(),
    officialEmail: formValues.officialEmail.trim() || undefined,
    addressLine: formValues.addressLine.trim(),
    city: formValues.city.trim(),
    district: formValues.district.trim(),
    state: formValues.state.trim(),
    pincode: formValues.pincode.trim(),
    latitude: formValues.latitude,
    longitude: formValues.longitude,
  });
}
