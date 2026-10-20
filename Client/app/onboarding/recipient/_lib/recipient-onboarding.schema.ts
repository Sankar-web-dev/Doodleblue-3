import { z } from "zod";

/** Place names: letters only, plus spaces, hyphens, apostrophes, dots. */
const PLACE_NAME_REGEX = /^[A-Za-z][A-Za-z\s.'-]*$/;

/** ISO calendar date "YYYY-MM-DD". */
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Recipient onboarding form schema — one shape shared by every wizard step.
 * Mirrors the PersonalProfile + RecipientProfile models in the Prisma schema.
 */
export const recipientOnboardingSchema = z
  .object({
    // Step 1: Personal Details (PersonalProfile)
    dateOfBirth: z
      .string()
      .min(1, "Birth date is required")
      .regex(DATE_REGEX, "Invalid date"),
    gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]),
    phoneNumber: z
      .string()
      .min(1, "Phone number is required")
      .regex(/^\+?\d{10,15}$/, "Enter a valid phone number (10–15 digits)"),
    maritalStatus: z.enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED", "OTHER"]),
    addressLine: z.string().max(200, "Address is too long"),
    city: z
      .string()
      .min(1, "City is required")
      .max(120)
      .regex(PLACE_NAME_REGEX, "Letters only"),
    district: z
      .string()
      .max(120)
      .refine((v) => !v || PLACE_NAME_REGEX.test(v), "Letters only"),
    state: z
      .string()
      .min(1, "State is required")
      .max(120)
      .regex(PLACE_NAME_REGEX, "Letters only"),
    pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
    latitude: z.number().optional(),
    longitude: z.number().optional(),

    // Step 2: Registration Context (RecipientProfile)
    registrationFor: z.enum(["SELF", "SOMEONE_ELSE"]),
    relationshipToPatient: z.string().max(120),
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
  latitude: undefined,
  longitude: undefined,

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
