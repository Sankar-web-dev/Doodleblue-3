import { api, PaginationMeta } from "@/lib/api";
import type {
  BloodComponent,
  BloodRequestStatus,
  BloodUrgency,
} from "./requests.api";
import type { BloodGroup } from "./profiles.api";

export type DonorResponseStatus =
  | "INTERESTED"
  | "CONTACTED"
  | "APPOINTMENT_SCHEDULED"
  | "COMPLETED"
  | "DECLINED"
  | "CANCELLED";

export interface DonorResponse {
  id: string;
  requestId: string;
  donorProfileId: string;
  status: DonorResponseStatus;
  unitsOffered: number;
  message?: string | null;
  contactedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  request?: {
    id: string;
    bloodGroup?: BloodGroup;
    component?: BloodComponent;
    urgency?: BloodUrgency;
    status?: BloodRequestStatus;
    city?: string;
    state?: string;
    hospitalName?: string | null;
    patientName?: string | null;
    requestType?: "BLOOD_BANK" | "RECIPIENT";
  } | null;
  donor?: {
    id: string;
    bloodGroup?: BloodGroup | null;
    user?: {
      id: string;
      name: string;
      image?: string | null;
      email?: string | null;
      personalProfile?: { phoneNumber?: string | null } | null;
    } | null;
  } | null;
}

export interface CreateDonorResponseInput {
  requestId: string;
  unitsOffered?: number;
  message?: string;
}

export const responsesApi = {
  createResponse: (input: CreateDonorResponseInput) =>
    api.post<{ response: DonorResponse }>(`/api/v1/responses`, input),

  listMine: (params: { status?: DonorResponseStatus; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set("status", params.status);
    if (params.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return api.getWithMeta<DonorResponse[], PaginationMeta>(
      `/api/v1/responses/mine${query ? `?${query}` : ""}`
    );
  },

  /** Request owner's view — all donor responses to a request. */
  listForRequest: (
    requestId: string,
    params: { status?: DonorResponseStatus; limit?: number } = {}
  ) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set("status", params.status);
    if (params.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return api.getWithMeta<DonorResponse[], PaginationMeta>(
      `/api/v1/responses/request/${requestId}${query ? `?${query}` : ""}`
    );
  },

  /** Owner advances the workflow (CONTACTED → APPOINTMENT_SCHEDULED → COMPLETED). */
  updateResponse: (
    id: string,
    input: {
      status?: DonorResponseStatus;
      unitsOffered?: number;
      message?: string;
      contactedAt?: string;
    }
  ) => api.patch<{ response: DonorResponse }>(`/api/v1/responses/${id}`, input),

  withdrawResponse: (id: string) => api.delete(`/api/v1/responses/${id}`),
};

export const MY_RESPONSES_KEY = ["responses", "mine"] as const;
