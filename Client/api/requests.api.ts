import { api, PaginationMeta } from "@/lib/api";
import type { BloodGroup } from "./profiles.api";

export type RequestType = "RECIPIENT" | "BLOOD_BANK";

export type BloodComponent =
  | "WHOLE_BLOOD"
  | "PACKED_RED_CELLS"
  | "PLATELETS"
  | "PLASMA"
  | "CRYOPRECIPITATE"
  | "OTHER";

export type BloodUrgency = "EMERGENCY" | "WITHIN_24_HOURS" | "SCHEDULED";

export type BloodRequestStatus =
  | "OPEN"
  | "PARTIALLY_FULFILLED"
  | "FULFILLED"
  | "CANCELLED"
  | "EXPIRED";

export interface BloodRequest {
  id: string;
  requestType: RequestType;
  createdByUserId: string;
  recipientProfileId?: string | null;
  bloodBankProfileId?: string | null;
  bloodGroup: BloodGroup;
  component: BloodComponent;
  unitsRequired: number;
  unitsFulfilled: number;
  urgency: BloodUrgency;
  status: BloodRequestStatus;
  requiredBy?: string | null;
  expiresAt?: string | null;
  patientName?: string | null;
  patientAge?: number | null;
  relationshipToPatient?: string | null;
  reason?: string | null;
  hospitalName?: string | null;
  hospitalAddress?: string | null;
  city: string;
  district?: string | null;
  state: string;
  pincode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  contactName?: string | null;
  contactPhone?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  creator?: { id: string; name: string; image?: string | null } | null;
  bloodBankProfile?: {
    id: string;
    institutionName?: string | null;
    city?: string | null;
  } | null;
  _count?: { responses: number; donations: number };
}

/** Payload shared by create + update. */
export interface BloodRequestInput {
  requestType?: RequestType;
  bloodGroup: BloodGroup;
  component?: BloodComponent;
  unitsRequired: number;
  urgency: BloodUrgency;
  requiredBy?: string;
  expiresAt?: string;
  patientName?: string;
  patientAge?: number;
  relationshipToPatient?: string;
  reason?: string;
  hospitalName?: string;
  hospitalAddress?: string;
  city: string;
  district?: string;
  state: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  contactName?: string;
  contactPhone?: string;
  notes?: string;
}

export interface ListRequestsParams {
  requestType?: RequestType;
  status?: BloodRequestStatus;
  urgency?: BloodUrgency;
  bloodGroup?: BloodGroup;
  search?: string;
  page?: number;
  limit?: number;
}

export const requestsApi = {
  /** The caller's own requests (recipient or blood bank). */
  listMine: (params: ListRequestsParams = {}) => {
    const qs = new URLSearchParams();
    qs.set("mine", "true");
    if (params.requestType) qs.set("requestType", params.requestType);
    if (params.status) qs.set("status", params.status);
    if (params.urgency) qs.set("urgency", params.urgency);
    if (params.bloodGroup) qs.set("bloodGroup", params.bloodGroup);
    if (params.search) qs.set("search", params.search);
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    return api.getWithMeta<BloodRequest[], PaginationMeta>(
      `/api/v1/requests?${qs.toString()}`
    );
  },

  getRequest: (id: string) =>
    api.get<{ request: BloodRequest }>(`/api/v1/requests/${id}`),

  createRequest: (input: BloodRequestInput) =>
    api.post<{ request: BloodRequest }>(`/api/v1/requests`, {
      requestType: input.requestType ?? "RECIPIENT",
      ...input,
    }),

  updateRequest: (id: string, input: BloodRequestInput) =>
    api.patch<{ request: BloodRequest }>(`/api/v1/requests/${id}`, input),

  setStatus: (id: string, status: BloodRequestStatus) =>
    api.patch<{ request: BloodRequest }>(`/api/v1/requests/${id}/status`, {
      status,
    }),

  /** Soft-delete — sets status to CANCELLED server-side. */
  cancelRequest: (id: string) => api.delete(`/api/v1/requests/${id}`),
};

export const REQUESTS_LIST_KEY = ["requests", "mine"] as const;
export const REQUEST_DETAIL_KEY = "request";
