import { z } from "zod";

/**
 * Recipient onboarding form schema — one shape shared by every wizard step.
 * Mirrors the PersonalProfile + RecipientProfile models in the Prisma schema.
 */
export const recipientOnboardingSchema = z
  .object({
    // Step 1: Personal Details (PersonalProfile)
    dateOfBirth: z.string().min(1, "Birth date is required"),
    gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]),
    phoneNumber: z
      .string()
      .min(1, "Phone number is required")
      .min(10, "Enter at least 10 digits"),
    maritalStatus: z.enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED", "OTHER"]),
    addressLine: z.string(),
    city: z.string().min(1, "City is required"),
    district: z.string(),
    state: z.string().min(1, "State is required"),
    pincode: z.string().min(6, "Enter 6 digit pincode"),

    // Step 2: Registration Context (RecipientProfile)
    registrationFor: z.enum(["SELF", "SOMEONE_ELSE"]),
    relationshipToPatient: z.string(),
  })
  .superRefine((values, ctx) => {
    if (
      values.registrationFor === "SOMEONE_ELSE" &&
      !values.relationshipToPatient.trim()
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["relationshipToPatient"],
        message: "Tell us your relationship to the patient",
      });
    }
  });

export type RecipientOnboardingFormValues = z.infer<
  typeof recipientOnboardingSchema
>;

export const RECIPIENT_ONBOARDING_DEFAULTS: RecipientOnboardingFormValues = {
  dateOfBirth: "2000-01-01",
  gender: "MALE",
  phoneNumber: "",
  maritalStatus: "SINGLE",
  addressLine: "",
  city: "",
  district: "",
  state: "",
  pincode: "",

  registrationFor: "SELF",
  relationshipToPatient: "",
};

/** Age in whole years from a YYYY-MM-DD string. */
export function calculateAge(dob: string): number {
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}
