import { api, PaginationMeta } from "@/lib/api";
import type { BloodRequestStatus, BloodUrgency } from "./requests.api";
import type { BloodGroup } from "./profiles.api";

export type AppointmentStatus =
  | "SCHEDULED"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "MISSED";

export interface Appointment {
  id: string;
  requestId: string;
  donorProfileId: string;
  donationId?: string | null;
  scheduledAt: string;
  location?: string | null;
  status: AppointmentStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  request?: {
    id: string;
    bloodGroup?: BloodGroup;
    urgency?: BloodUrgency;
    status?: BloodRequestStatus;
    city?: string;
    hospitalName?: string | null;
    createdByUserId?: string;
  } | null;
  donor?: {
    id: string;
    user?: { id: string; name: string; image?: string | null } | null;
  } | null;
  donation?: { id: string; status: string } | null;
}

export interface CreateAppointmentInput {
  requestId: string;
  scheduledAt: string;
  location?: string;
  notes?: string;
  donationId?: string;
  /** Owner/admin scheduling on a donor's behalf. */
  donorProfileId?: string;
}

export const appointmentsApi = {
  create: (input: CreateAppointmentInput) =>
    api.post<{ appointment: Appointment }>(`/api/v1/appointments`, input),

  /** Donor's own appointments. */
  listMine: (params: { status?: AppointmentStatus; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set("status", params.status);
    if (params.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return api.getWithMeta<Appointment[], PaginationMeta>(
      `/api/v1/appointments/mine${query ? `?${query}` : ""}`
    );
  },

  /** Blood bank view — appointments across all of the caller's requests. */
  listManage: (params: { status?: AppointmentStatus; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set("status", params.status);
    if (params.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return api.getWithMeta<Appointment[], PaginationMeta>(
      `/api/v1/appointments/manage${query ? `?${query}` : ""}`
    );
  },

  /** Request owner's view — appointments for one request. */
  listForRequest: (
    requestId: string,
    params: { status?: AppointmentStatus; limit?: number } = {}
  ) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set("status", params.status);
    if (params.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return api.getWithMeta<Appointment[], PaginationMeta>(
      `/api/v1/appointments/request/${requestId}${query ? `?${query}` : ""}`
    );
  },

  update: (
    id: string,
    input: {
      status?: AppointmentStatus;
      scheduledAt?: string;
      location?: string;
      notes?: string;
    }
  ) => api.patch<{ appointment: Appointment }>(`/api/v1/appointments/${id}`, input),

  cancel: (id: string) => api.delete(`/api/v1/appointments/${id}`),
};

export const MY_APPOINTMENTS_KEY = ["appointments", "mine"] as const;
export const MANAGE_APPOINTMENTS_KEY = ["appointments", "manage"] as const;
