import { z } from "zod";

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
    .min(10, "Enter at least 10 digits")
    .max(20),
  website: z
    .string()
    .max(200)
    .refine(
      (v) => !v || /^https?:\/\/.+\..+/.test(v),
      "Enter a valid URL (e.g. https://hospital.org)"
    ),
  registrationNumber: z.string().max(120),

  // Step 2: Primary Contact
  contactPersonName: z
    .string()
    .min(1, "Contact person name is required")
    .max(120),
  contactDesignation: z.enum([
    "ADMIN",
    "DOCTOR",
    "BLOOD_BANK_OFFICER",
    "OTHER",
  ]),
  contactPhone: z
    .string()
    .min(1, "Contact phone is required")
    .min(10, "Enter at least 10 digits")
    .max(20),
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
  city: z.string().min(1, "City is required").max(120),
  district: z.string().min(1, "District is required").max(120),
  state: z.string().min(1, "State is required").max(120),
  pincode: z
    .string()
    .min(6, "Enter 6 digit pincode")
    .max(10),
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
};
