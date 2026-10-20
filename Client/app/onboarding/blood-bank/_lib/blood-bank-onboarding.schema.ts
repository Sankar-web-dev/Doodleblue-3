import { z } from "zod";

/** Place names: letters only, plus spaces, hyphens, apostrophes, dots. */
const PLACE_NAME_REGEX = /^[A-Za-z][A-Za-z\s.'-]*$/;

/** Phone: digits only, exactly 10. */
const PHONE_REGEX = /^\d{10}$/;

/**
 * Blood bank onboarding form schema — one shape shared by every wizard step.
 * Required fields mirror REQUIRED_ON_CREATE in the server's BloodBankProfileService.
 */
export const bloodBankOnboardingSchema = z.object({
  // Step 1: Institution Details
  institutionName: z
    .string()
    .min(1, "Institution name is required")
    .max(200, "Institution name is too long"),
  hospitalType: z.enum(["GOVERNMENT", "PRIVATE", "TRUST", "OTHER"]),
  hospitalPhone: z
    .string()
    .min(1, "Institution phone is required")
    .regex(PHONE_REGEX, "Enter a valid 10-digit phone number"),
  website: z
    .string()
    .max(200)
    .refine(
      (v) => !v || /^https?:\/\/.+\..+/.test(v),
      "Enter a valid URL (e.g. https://hospital.org)"
    ),
  registrationNumber: z
    .string()
    .max(120)
    .regex(/^[A-Za-z0-9/-]*$/, "Letters, numbers, / and - only"),

  // Step 2: Primary Contact
  contactPersonName: z
    .string()
    .min(1, "Contact person name is required")
    .max(120)
    .regex(PLACE_NAME_REGEX, "Letters only"),
  contactDesignation: z.enum([
    "ADMIN",
    "DOCTOR",
    "BLOOD_BANK_OFFICER",
    "OTHER",
  ]),
  contactPhone: z
    .string()
    .min(1, "Contact phone is required")
    .regex(PHONE_REGEX, "Enter a valid 10-digit phone number"),
  officialEmail: z
    .string()
    .max(200)
    .refine(
      (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      "Enter a valid email address"
    ),

  // Step 3: Location
  addressLine: z
    .string()
    .min(1, "Address is required")
    .max(200),
  city: z
    .string()
    .min(1, "City is required")
    .max(120)
    .regex(PLACE_NAME_REGEX, "Letters only"),
  district: z
    .string()
    .min(1, "District is required")
    .max(120)
    .regex(PLACE_NAME_REGEX, "Letters only"),
  state: z
    .string()
    .min(1, "State is required")
    .max(120)
    .regex(PLACE_NAME_REGEX, "Letters only"),
  pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export type BloodBankOnboardingFormValues = z.infer<
  typeof bloodBankOnboardingSchema
>;

export const BLOOD_BANK_ONBOARDING_DEFAULTS: BloodBankOnboardingFormValues = {
  institutionName: "",
  hospitalType: "PRIVATE",
  hospitalPhone: "",
  website: "",
  registrationNumber: "",

  contactPersonName: "",
  contactDesignation: "BLOOD_BANK_OFFICER",
  contactPhone: "",
  officialEmail: "",

  addressLine: "",
  city: "",
  district: "",
  state: "",
  pincode: "",
  latitude: undefined,
  longitude: undefined,
};
