import {
  Activity,
  Compass,
  Droplet,
  Heart,
  ShieldCheck,
  User,
  type LucideIcon,
} from "lucide-react";
import type { BloodGroup } from "@/api/profiles.api";
import type { DonorOnboardingFormValues } from "./donor-onboarding.schema";

export const TOTAL_STEPS = 6;

export interface OnboardingStepMeta {
  num: number;
  title: string;
  icon: LucideIcon;
  desc: string;
}

export const ONBOARDING_STEPS: OnboardingStepMeta[] = [
  { num: 1, title: "Personal Details", icon: User, desc: "Identity & Location" },
  { num: 2, title: "Physical & Blood", icon: Droplet, desc: "Group, Height & Weight" },
  { num: 3, title: "Medical Screening", icon: Activity, desc: "Health & Surgical History" },
  { num: 4, title: "Gender Screening", icon: Heart, desc: "Clinical Safety Check" },
  { num: 5, title: "Preferences", icon: Compass, desc: "Availability & Travel" },
  { num: 6, title: "Health Assessment", icon: ShieldCheck, desc: "Eligibility Verification" },
];

export const BLOOD_GROUPS: { label: string; value: BloodGroup; desc: string }[] = [
  { label: "O+", value: "O_POSITIVE", desc: "Universal red cell compatibility for Rh+" },
  { label: "O-", value: "O_NEGATIVE", desc: "Universal blood donor (Emergency ready)" },
  { label: "A+", value: "A_POSITIVE", desc: "High demand in surgical & cancer care" },
  { label: "A-", value: "A_NEGATIVE", desc: "Essential for A- and AB- patients" },
  { label: "B+", value: "B_POSITIVE", desc: "Frequent demand in clinical emergencies" },
  { label: "B-", value: "B_NEGATIVE", desc: "Rare and crucial blood type" },
  { label: "AB+", value: "AB_POSITIVE", desc: "Universal plasma donor" },
  { label: "AB-", value: "AB_NEGATIVE", desc: "Rarest blood group worldwide" },
];

export const BLOOD_GROUP_LABELS: Record<string, string> = Object.fromEntries(
  BLOOD_GROUPS.map((b) => [b.value, b.label])
);

/** Fields validated before leaving each step (steps without an entry skip validation). */
export const STEP_VALIDATION_FIELDS: Record<
  number,
  (keyof DonorOnboardingFormValues)[]
> = {
  1: ["dateOfBirth", "gender", "phoneNumber", "city", "state", "pincode"],
  2: ["bloodGroup", "heightCm", "weightKg"],
};

export const STEP_VALIDATION_MESSAGES: Record<
  number,
  { title: string; description: string }
> = {
  1: {
    title: "Please fill required personal details",
    description:
      "Make sure your birth date, phone, and location fields are filled correctly.",
  },
  2: {
    title: "Please enter physical details",
    description: "Height and weight are required for donor assessment.",
  },
};
