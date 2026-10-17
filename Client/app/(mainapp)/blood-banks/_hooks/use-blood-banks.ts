import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  bloodBanksApi,
  BLOOD_BANKS_LIST_KEY,
  type VerifyBloodBankInput,
} from "@/api/blood-banks.api";
import type { VerificationStatus } from "@/api/profiles.api";

export function useBloodBanks(status?: VerificationStatus) {
  return useQuery({
    queryKey: [...BLOOD_BANKS_LIST_KEY, status ?? "ALL"],
    queryFn: () => bloodBanksApi.listBloodBanks({ status, limit: 100 }),
  });
}

export function useVerifyBloodBank(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: VerifyBloodBankInput }) =>
      bloodBanksApi.verifyBloodBank(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BLOOD_BANKS_LIST_KEY });
      onSuccess?.();
    },
  });
}
