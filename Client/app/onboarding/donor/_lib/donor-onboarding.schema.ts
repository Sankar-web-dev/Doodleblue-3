import { z } from "zod";
import { calculateAge } from "./eligibility";

/** Place names: letters only, plus spaces, hyphens, apostrophes, dots. */
const PLACE_NAME_REGEX = /^[A-Za-z][A-Za-z\s.'-]*$/;

/** ISO calendar date "YYYY-MM-DD". */
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Donor onboarding form schema — one shape shared by every wizard step.
 * Numbers rely on `valueAsNumber` registration in the form inputs.
 */
export const donorOnboardingSchema = z.object({
  // Step 1: Personal Details
  dateOfBirth: z
    .string()
    .min(1, "Birth date is required")
    .regex(DATE_REGEX, "Invalid date")
    .refine(
      (v) => calculateAge(v) >= 18 && calculateAge(v) <= 65,
      "Donor must be between 18 and 65 years old"
    ),
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

  // Step 2: Physical & Blood Profile
  bloodGroup: z.enum([
    "A_POSITIVE",
    "A_NEGATIVE",
    "B_POSITIVE",
    "B_NEGATIVE",
    "AB_POSITIVE",
    "AB_NEGATIVE",
    "O_POSITIVE",
    "O_NEGATIVE",
    "UNKNOWN",
  ]),
  heightCm: z
    .number({ error: "Height is required" })
    .min(120, "Height must be between 120–230 cm")
    .max(230, "Height must be between 120–230 cm"),
  weightKg: z
    .number({ error: "Weight is required" })
    .min(30, "Weight must be between 30–200 kg")
    .max(200, "Weight must be between 30–200 kg"),
  donatedBefore: z.boolean(),
  previousDonationCount: z
    .number({ error: "Enter a valid count" })
    .min(0)
    .max(100),
  lastDonationDate: z
    .string()
    .refine((v) => !v || DATE_REGEX.test(v), "Invalid date"),

  // Step 3: Health History & Medical Screening
  hasSeriousMedicalCondition: z.boolean(),
  medicalConditionDetails: z
    .string()
    .max(500, "Keep details under 500 characters"),
  hasDiabetes: z.boolean(),
  diabetesLevel: z.enum(["NONE", "CONTROLLED_DIET", "ORAL_MEDICATION", "INSULIN"]),
  takesMedication: z.boolean(),
  medicationDetails: z
    .string()
    .max(500, "Keep details under 500 characters"),
  hasHadSurgery: z.boolean(),
  lastSurgeryDate: z
    .string()
    .refine((v) => !v || DATE_REGEX.test(v), "Invalid date"),
  hasTattoo: z.boolean(),
  tattooDate: z
    .string()
    .refine((v) => !v || DATE_REGEX.test(v), "Invalid date"),
  regularAlcoholUse: z.boolean(),

  // Step 4: Gender Screening (Specific to Females)
  currentlyPregnant: z.boolean(),
  recentPregnancyOrDelivery: z.boolean(),
  lastPregnancyDate: z
    .string()
    .refine((v) => !v || DATE_REGEX.test(v), "Invalid date"),

  // Step 5: Donation Preferences
  isAvailable: z.boolean(),
  travelPreference: z.enum(["NEARBY", "ANYWHERE"]),
  maxTravelDistanceKm: z
    .number({ error: "Enter a valid distance" })
    .min(5)
    .max(200),
  contactPreference: z.enum(["EMAIL", "PHONE", "BOTH"]),
});

export type DonorOnboardingFormValues = z.infer<typeof donorOnboardingSchema>;

export const DONOR_ONBOARDING_DEFAULTS: DonorOnboardingFormValues = {
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

  bloodGroup: "O_POSITIVE",
  heightCm: 0,
  weightKg: 0,
  donatedBefore: false,
  previousDonationCount: 0,
  lastDonationDate: "",

  hasSeriousMedicalCondition: false,
  medicalConditionDetails: "",
  hasDiabetes: false,
  diabetesLevel: "NONE",
  takesMedication: false,
  medicationDetails: "",
  hasHadSurgery: false,
  lastSurgeryDate: "",
  hasTattoo: false,
  tattooDate: "",
  regularAlcoholUse: false,

  currentlyPregnant: false,
  recentPregnancyOrDelivery: false,
  lastPregnancyDate: "",

  isAvailable: true,
  travelPreference: "NEARBY",
  maxTravelDistanceKm: 25,
  contactPreference: "BOTH",
};
