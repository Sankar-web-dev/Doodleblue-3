import { z } from "zod";
import type { BloodGroup } from "@/api/profiles.api";
import type {
  BloodComponent,
  BloodRequest,
  BloodRequestInput,
  BloodRequestStatus,
  BloodUrgency,
} from "@/api/requests.api";

// ---------------------------------------------------------------------------
// Option lists — mirror the Prisma enums on the server.
// ---------------------------------------------------------------------------

export const BLOOD_GROUP_OPTIONS: { label: string; value: BloodGroup }[] = [
  { label: "O+", value: "O_POSITIVE" },
  { label: "O-", value: "O_NEGATIVE" },
  { label: "A+", value: "A_POSITIVE" },
  { label: "A-", value: "A_NEGATIVE" },
  { label: "B+", value: "B_POSITIVE" },
  { label: "B-", value: "B_NEGATIVE" },
  { label: "AB+", value: "AB_POSITIVE" },
  { label: "AB-", value: "AB_NEGATIVE" },
];

export const COMPONENT_OPTIONS: { label: string; value: BloodComponent }[] = [
  { label: "Whole Blood", value: "WHOLE_BLOOD" },
  { label: "Packed Red Cells", value: "PACKED_RED_CELLS" },
  { label: "Platelets", value: "PLATELETS" },
  { label: "Plasma", value: "PLASMA" },
  { label: "Cryoprecipitate", value: "CRYOPRECIPITATE" },
  { label: "Other", value: "OTHER" },
];

export const URGENCY_OPTIONS: { label: string; value: BloodUrgency }[] = [
  { label: "Emergency — needed now", value: "EMERGENCY" },
  { label: "Within 24 hours", value: "WITHIN_24_HOURS" },
  { label: "Scheduled / planned", value: "SCHEDULED" },
];

// ---------------------------------------------------------------------------
// Display labels
// ---------------------------------------------------------------------------

export const BLOOD_GROUP_LABELS: Record<string, string> = {
  O_POSITIVE: "O+",
  O_NEGATIVE: "O-",
  A_POSITIVE: "A+",
  A_NEGATIVE: "A-",
  B_POSITIVE: "B+",
  B_NEGATIVE: "B-",
  AB_POSITIVE: "AB+",
  AB_NEGATIVE: "AB-",
  UNKNOWN: "Any",
};

export const COMPONENT_LABELS: Record<BloodComponent, string> = {
  WHOLE_BLOOD: "Whole Blood",
  PACKED_RED_CELLS: "Packed Red Cells",
  PLATELETS: "Platelets",
  PLASMA: "Plasma",
  CRYOPRECIPITATE: "Cryoprecipitate",
  OTHER: "Other",
};

export const URGENCY_LABELS: Record<BloodUrgency, string> = {
  EMERGENCY: "Emergency",
  WITHIN_24_HOURS: "Within 24 hrs",
  SCHEDULED: "Scheduled",
};

export const STATUS_LABELS: Record<BloodRequestStatus, string> = {
  OPEN: "Open",
  PARTIALLY_FULFILLED: "Partially Fulfilled",
  FULFILLED: "Fulfilled",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
};

// ---------------------------------------------------------------------------
// Form schema — mirrors CreateBloodRequestDto limits on the server.
// ---------------------------------------------------------------------------

export const bloodRequestFormSchema = z.object({
  bloodGroup: z.string().min(1, "Select a blood group"),
  component: z.enum([
    "WHOLE_BLOOD",
    "PACKED_RED_CELLS",
    "PLATELETS",
    "PLASMA",
    "CRYOPRECIPITATE",
    "OTHER",
  ]),
  unitsRequired: z
    .number({ error: "Units required" })
    .int("Whole units only")
    .min(1, "At least 1 unit")
    .max(50, "Maximum 50 units"),
  urgency: z.enum(["EMERGENCY", "WITHIN_24_HOURS", "SCHEDULED"]),
  requiredBy: z.string().optional(),
  expiresAt: z.string().optional(),

  patientName: z.string().max(120).optional(),
  patientAge: z
    .number()
    .int("Whole years only")
    .min(0, "Invalid age")
    .max(120, "Invalid age")
    .optional(),
  relationshipToPatient: z.string().max(120).optional(),

  hospitalName: z.string().max(200).optional(),
  hospitalAddress: z.string().max(300).optional(),
  city: z.string().min(1, "City is required").max(120),
  district: z.string().max(120).optional(),
  state: z.string().min(1, "State is required").max(120),
  pincode: z.string().max(10).optional(),

  contactName: z.string().max(120).optional(),
  contactPhone: z.string().max(20).optional(),
  notes: z.string().max(1000, "Keep notes under 1000 characters").optional(),
});

export type BloodRequestFormValues = z.infer<typeof bloodRequestFormSchema>;

export const BLOOD_REQUEST_FORM_DEFAULTS: BloodRequestFormValues = {
  bloodGroup: "",
  component: "WHOLE_BLOOD",
  unitsRequired: 1,
  urgency: "EMERGENCY",
  requiredBy: "",
  expiresAt: "",

  patientName: "",
  patientAge: undefined,
  relationshipToPatient: "",

  hospitalName: "",
  hospitalAddress: "",
  city: "",
  district: "",
  state: "",
  pincode: "",

  contactName: "",
  contactPhone: "",
  notes: "",
};

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

const emptyToUndefined = (v?: string) => {
  const t = v?.trim();
  return t ? t : undefined;
};

/** Convert an ISO datetime to a yyyy-mm-dd value for <input type="date">. */
export const toDateInputValue = (iso?: string | null) =>
  iso ? iso.slice(0, 10) : "";

/** Form values → API payload. Strips empty strings from optional fields. */
export function toRequestInput(
  values: BloodRequestFormValues
): BloodRequestInput {
  return {
    bloodGroup: values.bloodGroup as BloodGroup,
    component: values.component,
    unitsRequired: values.unitsRequired,
    urgency: values.urgency,
    requiredBy: emptyToUndefined(values.requiredBy),
    expiresAt: emptyToUndefined(values.expiresAt),
    patientName: emptyToUndefined(values.patientName),
    patientAge: values.patientAge,
    relationshipToPatient: emptyToUndefined(values.relationshipToPatient),
    hospitalName: emptyToUndefined(values.hospitalName),
    hospitalAddress: emptyToUndefined(values.hospitalAddress),
    city: values.city.trim(),
    district: emptyToUndefined(values.district),
    state: values.state.trim(),
    pincode: emptyToUndefined(values.pincode),
    contactName: emptyToUndefined(values.contactName),
    contactPhone: emptyToUndefined(values.contactPhone),
    notes: emptyToUndefined(values.notes),
  };
}

/** API request → form values for the edit page. */
export function fromRequest(request: BloodRequest): BloodRequestFormValues {
  return {
    bloodGroup: request.bloodGroup,
    component: request.component ?? "WHOLE_BLOOD",
    unitsRequired: request.unitsRequired,
    urgency: request.urgency,
    requiredBy: toDateInputValue(request.requiredBy),
    expiresAt: toDateInputValue(request.expiresAt),
    patientName: request.patientName ?? "",
    patientAge: request.patientAge ?? undefined,
    relationshipToPatient: request.relationshipToPatient ?? "",
    hospitalName: request.hospitalName ?? "",
    hospitalAddress: request.hospitalAddress ?? "",
    city: request.city ?? "",
    district: request.district ?? "",
    state: request.state ?? "",
    pincode: request.pincode ?? "",
    contactName: request.contactName ?? "",
    contactPhone: request.contactPhone ?? "",
    notes: request.notes ?? "",
  };
}

// ---------------------------------------------------------------------------
// Poster data — normalized shape consumed by <RequestPoster />.
// ---------------------------------------------------------------------------

export interface RequestPosterData {
  institutionName?: string | null;
  bloodGroup: BloodGroup | string;
  component: BloodComponent;
  unitsRequired: number;
  unitsFulfilled?: number;
  urgency: BloodUrgency;
  status?: BloodRequestStatus;
  requiredBy?: string | null;
  expiresAt?: string | null;
  patientName?: string | null;
  patientAge?: number | null;
  relationshipToPatient?: string | null;
  hospitalName?: string | null;
  hospitalAddress?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  pincode?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  notes?: string | null;
}

export function posterDataFromValues(
  values: BloodRequestFormValues,
  institutionName?: string | null
): RequestPosterData {
  return {
    institutionName,
    bloodGroup: values.bloodGroup,
    component: values.component,
    unitsRequired: values.unitsRequired,
    urgency: values.urgency,
    requiredBy: emptyToUndefined(values.requiredBy),
    expiresAt: emptyToUndefined(values.expiresAt),
    patientName: emptyToUndefined(values.patientName),
    patientAge: values.patientAge,
    relationshipToPatient: emptyToUndefined(values.relationshipToPatient),
    hospitalName: emptyToUndefined(values.hospitalName),
    hospitalAddress: emptyToUndefined(values.hospitalAddress),
    city: emptyToUndefined(values.city),
    district: emptyToUndefined(values.district),
    state: emptyToUndefined(values.state),
    pincode: emptyToUndefined(values.pincode),
    contactName: emptyToUndefined(values.contactName),
    contactPhone: emptyToUndefined(values.contactPhone),
    notes: emptyToUndefined(values.notes),
  };
}

export function posterDataFromRequest(
  request: BloodRequest
): RequestPosterData {
  return {
    institutionName: request.bloodBankProfile?.institutionName,
    bloodGroup: request.bloodGroup,
    component: request.component,
    unitsRequired: request.unitsRequired,
    unitsFulfilled: request.unitsFulfilled,
    urgency: request.urgency,
    status: request.status,
    requiredBy: request.requiredBy,
    expiresAt: request.expiresAt,
    patientName: request.patientName,
    patientAge: request.patientAge,
    relationshipToPatient: request.relationshipToPatient,
    hospitalName: request.hospitalName,
    hospitalAddress: request.hospitalAddress,
    city: request.city,
    district: request.district,
    state: request.state,
    pincode: request.pincode,
    contactName: request.contactName,
    contactPhone: request.contactPhone,
    notes: request.notes,
  };
}
