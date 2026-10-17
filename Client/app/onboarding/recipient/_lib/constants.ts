import { HeartHandshake, ShieldCheck, User, type LucideIcon } from "lucide-react";
import type { RecipientOnboardingFormValues } from "./recipient-onboarding.schema";

export interface OnboardingStepMeta {
  num: number;
  title: string;
  icon: LucideIcon;
  desc: string;
}

export const TOTAL_STEPS = 3;

export const ONBOARDING_STEPS: OnboardingStepMeta[] = [
  { num: 1, title: "Personal Details", icon: User, desc: "Identity & Location" },
  {
    num: 2,
    title: "Registration Context",
    icon: HeartHandshake,
    desc: "Self or On Behalf",
  },
  {
    num: 3,
    title: "Review & Confirm",
    icon: ShieldCheck,
    desc: "Summary & Activation",
  },
];

/** Fields validated before leaving each step (steps without an entry skip validation). */
export const STEP_VALIDATION_FIELDS: Record<
  number,
  (keyof RecipientOnboardingFormValues)[]
> = {
  1: ["dateOfBirth", "gender", "phoneNumber", "city", "state", "pincode"],
  2: ["registrationFor", "relationshipToPatient"],
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
    title: "Please complete the registration context",
    description:
      "If you are registering for someone else, tell us your relationship to the patient.",
  },
};

export const REGISTRATION_FOR_LABELS: Record<string, string> = {
  SELF: "Myself",
  SOMEONE_ELSE: "Someone Else",
};
