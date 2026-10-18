import { api, PaginationMeta } from "@/lib/api";

export type DonationStatus =
  | "REGISTERED"
  | "SCREENING"
  | "APPROVED"
  | "COMPLETED"
  | "DEFERRED"
  | "CANCELLED";

export type ClinicalScreeningStatus =
  | "NOT_RECORDED"
  | "PENDING"
  | "CLEARED"
  | "DEFERRED"
  | "REFERRED";

export interface DonationScreening {
  id: string;
  donationId: string;
  recentFever?: boolean | null;
  alcoholWithin24Hours?: boolean | null;
  currentlyUnwell?: boolean | null;
  recentInfection?: boolean | null;
  medicationChanges?: boolean | null;
  additionalNotes?: string | null;
  clinicalStatus: ClinicalScreeningStatus;
  hivScreeningStatus?: ClinicalScreeningStatus;
  reviewedByUserId?: string | null;
  reviewedAt?: string | null;
  deferUntil?: string | null;
  reviewerNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Donation {
  id: string;
  requestId: string;
  donorProfileId: string;
  status: DonationStatus;
  unitsDonated: number;
  donationDate?: string | null;
  collectionLocation?: string | null;
  notes?: string | null;
  verifiedByUserId?: string | null;
  verifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  request?: {
    id: string;
    bloodGroup?: string;
    component?: string;
    urgency?: string;
    status?: string;
    city?: string;
    state?: string;
    hospitalName?: string | null;
    patientName?: string | null;
    requestType?: "BLOOD_BANK" | "RECIPIENT";
    contactName?: string | null;
    contactPhone?: string | null;
    creator?: { id: string; name: string } | null;
  } | null;
  screening?: { id: string; clinicalStatus: ClinicalScreeningStatus } | null;
  verifiedBy?: { id: string; name: string } | null;
}

export interface UpsertScreeningInput {
  recentFever?: boolean;
  alcoholWithin24Hours?: boolean;
  currentlyUnwell?: boolean;
  recentInfection?: boolean;
  medicationChanges?: boolean;
  additionalNotes?: string;
}

export const donationsApi = {
  /** Donor registers a donation against a request (creates the record the screening hangs off). */
  registerDonation: (input: { requestId: string; unitsDonated?: number }) =>
    api.post<{ donation: Donation }>(`/api/v1/donations`, input),

  listMine: (limit = 100) =>
    api.getWithMeta<Donation[], PaginationMeta>(
      `/api/v1/donations/mine?limit=${limit}`
    ),

  getScreening: (donationId: string) =>
    api.get<{ screening: DonationScreening | null }>(
      `/api/v1/donations/${donationId}/screening`
    ),

  upsertScreening: (donationId: string, input: UpsertScreeningInput) =>
    api.put<{ screening: DonationScreening }>(
      `/api/v1/donations/${donationId}/screening`,
      input
    ),
};

export const MY_DONATIONS_KEY = ["donations", "mine"] as const;
