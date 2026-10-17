import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  REQUESTS_LIST_KEY,
  requestsApi,
  type BloodRequestInput,
  type BloodRequestStatus,
  type ListRequestsParams,
} from "@/api/requests.api";

export function useMyRequests(params: ListRequestsParams = {}) {
  return useQuery({
    queryKey: [...REQUESTS_LIST_KEY, params],
    queryFn: () => requestsApi.listMine({ limit: 100, ...params }),
  });
}

export function useRequest(id: string | null) {
  return useQuery({
    queryKey: [REQUESTS_LIST_KEY[0], "detail", id],
    queryFn: () => requestsApi.getRequest(id!).then((res) => res.request),
    enabled: !!id,
  });
}

function useInvalidateRequests() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: [REQUESTS_LIST_KEY[0]] });
}

export function useCreateRequest(onSuccess?: () => void) {
  const invalidate = useInvalidateRequests();
  return useMutation({
    mutationFn: (input: BloodRequestInput) =>
      requestsApi.createRequest(input),
    onSuccess: () => {
      invalidate();
      onSuccess?.();
    },
  });
}

export function useUpdateRequest(id: string, onSuccess?: () => void) {
  const invalidate = useInvalidateRequests();
  return useMutation({
    mutationFn: (input: BloodRequestInput) =>
      requestsApi.updateRequest(id, input),
    onSuccess: () => {
      invalidate();
      onSuccess?.();
    },
  });
}

export function useSetRequestStatus(onSuccess?: () => void) {
  const invalidate = useInvalidateRequests();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: BloodRequestStatus }) =>
      requestsApi.setStatus(id, status),
    onSuccess: () => {
      invalidate();
      onSuccess?.();
    },
  });
}

export function useCancelRequest(onSuccess?: () => void) {
  const invalidate = useInvalidateRequests();
  return useMutation({
    mutationFn: (id: string) => requestsApi.cancelRequest(id),
    onSuccess: () => {
      invalidate();
      onSuccess?.();
    },
  });
}
