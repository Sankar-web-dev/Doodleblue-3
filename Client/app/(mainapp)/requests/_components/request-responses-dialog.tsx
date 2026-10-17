"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Droplet, HeartHandshake, Loader2 } from "lucide-react";

import {
  DonorResponseStatus,
  responsesApi,
} from "@/api/responses.api";
import { ApiRequestError } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppDialog } from "@/components/ui/dialog";
import { REQUESTS_LIST_KEY } from "@/api/requests.api";
import { BLOOD_GROUP_LABELS } from "../_lib/request-form";

const STATUS_STYLES: Record<DonorResponseStatus, string> = {
  INTERESTED: "bg-blue-500/10 text-blue-700 border-blue-500/30",
  CONTACTED: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  APPOINTMENT_SCHEDULED:
    "bg-indigo-500/10 text-indigo-700 border-indigo-500/30",
  COMPLETED: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  DECLINED: "bg-muted text-muted-foreground border-border",
  CANCELLED: "bg-muted text-muted-foreground border-border",
};

const STATUS_LABELS: Record<DonorResponseStatus, string> = {
  INTERESTED: "Interested",
  CONTACTED: "Contacted",
  APPOINTMENT_SCHEDULED: "Appointment scheduled",
  COMPLETED: "Completed",
  DECLINED: "Declined",
  CANCELLED: "Withdrawn",
};

const NEXT_STEP: Partial<
  Record<DonorResponseStatus, { status: DonorResponseStatus; label: string }>
> = {
  INTERESTED: { status: "CONTACTED", label: "Mark contacted" },
  CONTACTED: { status: "APPOINTMENT_SCHEDULED", label: "Schedule appointment" },
  APPOINTMENT_SCHEDULED: { status: "COMPLETED", label: "Mark completed" },
};

const formatDate = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

interface RequestResponsesDialogProps {
  requestId: string | null;
  onClose: () => void;
}

/** Bank-side view — every donor who responded to a request. */
export function RequestResponsesDialog({
  requestId,
  onClose,
}: RequestResponsesDialogProps) {
  const queryClient = useQueryClient();

  const { data, isPending, error } = useQuery({
    queryKey: ["responses", "request", requestId],
    queryFn: () => responsesApi.listForRequest(requestId!, { limit: 100 }),
    enabled: !!requestId,
  });
  const responses = data?.data ?? [];

  const advanceMutation = useMutation({
    mutationFn: (args: { id: string; status: DonorResponseStatus }) =>
      responsesApi.updateResponse(args.id, {
        status: args.status,
        contactedAt: new Date().toISOString(),
      }),
    onSuccess: () => {
      toast.success("Response updated");
      queryClient.invalidateQueries({
        queryKey: ["responses", "request", requestId],
      });
      queryClient.invalidateQueries({ queryKey: REQUESTS_LIST_KEY });
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiRequestError
          ? err.message
          : "Could not update the response"
      ),
  });

  return (
    <AppDialog
      open={!!requestId}
      onOpenChange={(v) => !v && onClose()}
      size="lg"
      title="Donor Responses"
      icon={<HeartHandshake className="h-5 w-5 text-primary" />}
      description="Donors who answered this request. Move each response forward as you contact them."
    >
      {isPending && (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading responses…
        </div>
      )}

      {error && !isPending && (
        <p className="py-8 text-center text-sm text-destructive">
          {error instanceof Error
            ? error.message
            : "Could not load responses."}
        </p>
      )}

      {!isPending && !error && responses.length === 0 && (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No donors have responded yet.
        </p>
      )}

      <ul className="divide-y divide-border/60">
        {responses.map((r) => {
          const next = NEXT_STEP[r.status];
          return (
            <li key={r.id} className="flex items-start gap-3 py-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {(r.donor?.user?.name ?? "D").slice(0, 2).toUpperCase()}
              </span>

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">
                    {r.donor?.user?.name ?? "Donor"}
                  </p>
                  {r.donor?.bloodGroup && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Droplet className="h-3 w-3 text-rose-500" />
                      {BLOOD_GROUP_LABELS[r.donor.bloodGroup] ??
                        r.donor.bloodGroup}
                    </span>
                  )}
                  <Badge
                    variant="outline"
                    className={`${STATUS_STYLES[r.status]} text-[10px]`}
                  >
                    {STATUS_LABELS[r.status]}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Offered{" "}
                  <span className="font-semibold text-foreground">
                    {r.unitsOffered} {r.unitsOffered === 1 ? "unit" : "units"}
                  </span>{" "}
                  · {formatDate(r.createdAt)}
                </p>
                {r.message && (
                  <p className="text-xs italic text-muted-foreground">
                    &quot;{r.message}&quot;
                  </p>
                )}
              </div>

              {next && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 shrink-0 text-xs"
                  disabled={advanceMutation.isPending}
                  onClick={() =>
                    advanceMutation.mutate({ id: r.id, status: next.status })
                  }
                >
                  {next.label}
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </AppDialog>
  );
}
