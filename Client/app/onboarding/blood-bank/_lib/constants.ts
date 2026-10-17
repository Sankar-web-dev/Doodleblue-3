import {
  Building2,
  ClipboardCheck,
  MapPin,
  PhoneCall,
} from "lucide-react";
import type { ContactDesignation, HospitalType } from "@/api/profiles.api";
import type { OnboardingStepMeta } from "../../_components/onboarding-stepper";
import type { BloodBankOnboardingFormValues } from "./blood-bank-onboarding.schema";

export const TOTAL_STEPS = 4;

export const ONBOARDING_STEPS: OnboardingStepMeta[] = [
  { num: 1, title: "Institution", icon: Building2, desc: "Identity & Licensing" },
  { num: 2, title: "Primary Contact", icon: PhoneCall, desc: "Nodal Officer Details" },
  { num: 3, title: "Location", icon: MapPin, desc: "Facility Address" },
  { num: 4, title: "Review & Submit", icon: ClipboardCheck, desc: "Verification Request" },
];

export const HOSPITAL_TYPES: { label: string; value: HospitalType }[] = [
  { label: "Government", value: "GOVERNMENT" },
  { label: "Private", value: "PRIVATE" },
  { label: "Trust / Charitable", value: "TRUST" },
  { label: "Other", value: "OTHER" },
];

export const CONTACT_DESIGNATIONS: {
  label: string;
  value: ContactDesignation;
}[] = [
  { label: "Administrator", value: "ADMIN" },
  { label: "Doctor", value: "DOCTOR" },
  { label: "Blood Bank Officer", value: "BLOOD_BANK_OFFICER" },
  { label: "Other", value: "OTHER" },
];

/** Fields validated before leaving each step (step 4 is the review step). */
export const STEP_VALIDATION_FIELDS: Record<
  number,
  (keyof BloodBankOnboardingFormValues)[]
> = {
  1: [
    "institutionName",
    "hospitalType",
    "hospitalPhone",
    "website",
    "registrationNumber",
  ],
  2: [
    "contactPersonName",
    "contactDesignation",
    "contactPhone",
    "officialEmail",
  ],
  3: ["addressLine", "city", "district", "state", "pincode"],
};

export const STEP_VALIDATION_MESSAGES: Record<
  number,
  { title: string; description: string }
> = {
  1: {
    title: "Please fill institution details",
    description:
      "Institution name, type, and phone are required for verification.",
  },
  2: {
    title: "Please fill contact details",
    description:
      "A primary contact person is required for verification callbacks.",
  },
  3: {
    title: "Please fill the facility address",
    description: "All address fields are required to locate the blood bank.",
  },
};
