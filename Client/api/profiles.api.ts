import { api } from "@/lib/api";

export type Gender = "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";

export type MaritalStatus =
  | "SINGLE"
  | "MARRIED"
  | "DIVORCED"
  | "WIDOWED"
  | "OTHER";

export type BloodGroup =
  | "A_POSITIVE"
  | "A_NEGATIVE"
  | "B_POSITIVE"
  | "B_NEGATIVE"
  | "AB_POSITIVE"
  | "AB_NEGATIVE"
  | "O_POSITIVE"
  | "O_NEGATIVE"
  | "UNKNOWN";

export type TravelPreference = "NEARBY" | "ANYWHERE";

export type ContactPreference = "EMAIL" | "PHONE" | "BOTH";

export type HospitalType = "GOVERNMENT" | "PRIVATE" | "TRUST" | "OTHER";

export type ContactDesignation =
  | "ADMIN"
  | "DOCTOR"
  | "BLOOD_BANK_OFFICER"
  | "OTHER";

export type VerificationStatus =
  | "PENDING"
  | "VERIFIED"
  | "REJECTED"
  | "SUSPENDED";

export interface PersonalProfile {
  id?: string;
  userId?: string;
  dateOfBirth?: string | null;
  gender?: Gender | null;
  phoneNumber?: string | null;
  maritalStatus?: MaritalStatus | null;
  addressLine?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  pincode?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface DonorProfile {
  id?: string;
  userId?: string;
  bloodGroup?: BloodGroup | null;
  heightCm?: number | null;
  weightKg?: number | null;
  donatedBefore?: boolean;
  previousDonationCount?: number;
  lastDonationDate?: string | null;
  takesMedication?: boolean | null;
  medicationDetails?: string | null;
  hasTattoo?: boolean | null;
  tattooDate?: string | null;
  hasSeriousMedicalCondition?: boolean | null;
  medicalConditionDetails?: string | null;
  hasDiabetes?: boolean | null;
  diabetesLevel?: string | null;
  hasHadSurgery?: boolean | null;
  lastSurgeryDate?: string | null;
  regularAlcoholUse?: boolean | null;
  currentlyPregnant?: boolean | null;
  recentPregnancyOrDelivery?: boolean | null;
  lastPregnancyDate?: string | null;
  isAvailable?: boolean;
  travelPreference?: TravelPreference;
  maxTravelDistanceKm?: number | null;
  contactPreference?: ContactPreference;
  profileCompleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BloodBankProfile {
  id?: string;
  userId?: string;
  institutionName?: string | null;
  hospitalType?: HospitalType;
  hospitalPhone?: string | null;
  website?: string | null;
  contactPersonName?: string | null;
  contactDesignation?: ContactDesignation;
  contactPhone?: string | null;
  officialEmail?: string | null;
  addressLine?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  pincode?: string | null;
  registrationNumber?: string | null;
  verificationStatus?: VerificationStatus;
  verificationNotes?: string | null;
  verifiedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type RegistrationFor = "SELF" | "SOMEONE_ELSE";

export interface RecipientProfile {
  id?: string;
  userId?: string;
  registrationFor?: RegistrationFor;
  relationshipToPatient?: string | null;
  profileCompleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const profilesApi = {
  // Personal Profile
  getPersonalProfile: () =>
    api.get<{ profile: PersonalProfile | null }>("/api/v1/profiles/personal/me"),

  upsertPersonalProfile: (dto: Partial<PersonalProfile>) =>
    api.put<{ profile: PersonalProfile }>("/api/v1/profiles/personal/me", dto),

  // Donor Profile
  getDonorProfile: () =>
    api.get<{ profile: DonorProfile | null }>("/api/v1/profiles/donor/me"),

  upsertDonorProfile: (dto: Partial<DonorProfile>) =>
    api.put<{ profile: DonorProfile }>("/api/v1/profiles/donor/me", dto),

  // Blood Bank Profile
  getBloodBankProfile: () =>
    api.get<{ profile: BloodBankProfile | null }>(
      "/api/v1/profiles/blood-bank/me"
    ),

  upsertBloodBankProfile: (dto: Partial<BloodBankProfile>) =>
    api.put<{ profile: BloodBankProfile }>(
      "/api/v1/profiles/blood-bank/me",
      dto
    ),

  // Recipient Profile
  getRecipientProfile: () =>
    api.get<{ profile: RecipientProfile | null }>(
      "/api/v1/profiles/recipient/me"
    ),

  upsertRecipientProfile: (dto: Partial<RecipientProfile>) =>
    api.put<{ profile: RecipientProfile }>(
      "/api/v1/profiles/recipient/me",
      dto
    ),
};

export const PROFILES_PERSONAL_KEY = ["profiles", "personal", "me"] as const;
export const PROFILES_DONOR_KEY = ["profiles", "donor", "me"] as const;
export const PROFILES_BLOOD_BANK_KEY = [
  "profiles",
  "blood-bank",
  "me",
] as const;
export const PROFILES_RECIPIENT_KEY = ["profiles", "recipient", "me"] as const;
