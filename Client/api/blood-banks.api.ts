import { api, PaginationMeta } from "@/lib/api";
import type { BloodBankProfile, VerificationStatus } from "./profiles.api";

/** Blood bank profile with the owning user and verifier included by the admin list endpoint. */
export interface BloodBankListItem extends BloodBankProfile {
  user?: { id: string; name: string; email: string } | null;
  verifiedBy?: { id: string; name: string } | null;
}

export interface ListBloodBanksParams {
  search?: string;
  status?: VerificationStatus;
  page?: number;
  limit?: number;
}

export interface VerifyBloodBankInput {
  status: VerificationStatus;
  notes?: string;
}

export const bloodBanksApi = {
  /** Admin directory — requires users:read. */
  listBloodBanks: (params: ListBloodBanksParams = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.status) qs.set("status", params.status);
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return api.getWithMeta<BloodBankListItem[], PaginationMeta>(
      `/api/v1/profiles/blood-bank${query ? `?${query}` : ""}`
    );
  },

  /** Approve / reject / suspend — requires users:update. */
  verifyBloodBank: (id: string, input: VerifyBloodBankInput) =>
    api.patch<{ profile: BloodBankProfile }>(
      `/api/v1/profiles/blood-bank/${id}/verification`,
      input
    ),
};

export const BLOOD_BANKS_LIST_KEY = ["blood-banks", "list"] as const;
