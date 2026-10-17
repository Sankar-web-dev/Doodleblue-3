import { z } from "zod";

/**
 * Donor onboarding form schema — one shape shared by every wizard step.
 * Numbers rely on `valueAsNumber` registration in the form inputs.
 */
export const donorOnboardingSchema = z.object({
  // Step 1: Personal Details
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
  lastDonationDate: z.string(),

  // Step 3: Health History & Medical Screening
  hasSeriousMedicalCondition: z.boolean(),
  medicalConditionDetails: z.string(),
  hasDiabetes: z.boolean(),
  diabetesLevel: z.enum(["NONE", "CONTROLLED_DIET", "ORAL_MEDICATION", "INSULIN"]),
  takesMedication: z.boolean(),
  medicationDetails: z.string(),
  hasHadSurgery: z.boolean(),
  lastSurgeryDate: z.string(),
  hasTattoo: z.boolean(),
  tattooDate: z.string(),
  regularAlcoholUse: z.boolean(),

  // Step 4: Gender Screening (Specific to Females)
  currentlyPregnant: z.boolean(),
  recentPregnancyOrDelivery: z.boolean(),
  lastPregnancyDate: z.string(),

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
