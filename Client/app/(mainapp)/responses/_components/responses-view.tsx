"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
import {
  Droplet,
  Eye,
  HeartHandshake,
  Loader2,
  Undo2,
} from "lucide-react";

import {
  DonorResponse,
  DonorResponseStatus,
  MY_RESPONSES_KEY,
  responsesApi,
} from "@/api/responses.api";
import { ApiRequestError } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AppDialog } from "@/components/ui/dialog";
import GenericTable from "@/components/ui/generic-table";
import {
  BLOOD_GROUP_LABELS,
  COMPONENT_LABELS,
} from "@/app/(mainapp)/requests/_lib/request-form";

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

const WITHDRAWABLE: DonorResponseStatus[] = [
  "INTERESTED",
  "CONTACTED",
  "APPOINTMENT_SCHEDULED",
];

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

/** Donor's own response history — what they offered against each request. */
export function ResponsesView() {
  const queryClient = useQueryClient();
  const [withdrawId, setWithdrawId] = useState<string | null>(null);

  const { data, isPending, error } = useQuery({
    queryKey: MY_RESPONSES_KEY,
    queryFn: () => responsesApi.listMine({ limit: 100 }),
    staleTime: 0,
  });
  const responses = useMemo(() => data?.data ?? [], [data]);

  const withdrawMutation = useMutation({
    mutationFn: (id: string) => responsesApi.withdrawResponse(id),
    onSuccess: () => {
      toast.success("Response withdrawn");
      setWithdrawId(null);
      queryClient.invalidateQueries({ queryKey: MY_RESPONSES_KEY });
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiRequestError
          ? err.message
          : "Could not withdraw the response"
      );
    },
  });

  const columns = useMemo<ColumnDef<DonorResponse, unknown>[]>(
    () => [
      {
        id: "request",
        accessorFn: (r) => r.request?.bloodGroup ?? "",
        header: "Request",
        cell: ({ row }) => {
          const req = row.original.request;
          return (
            <div className="flex items-center gap-3 py-1">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Droplet className="h-4 w-4 fill-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {req?.bloodGroup
                    ? (BLOOD_GROUP_LABELS[req.bloodGroup] ?? req.bloodGroup)
                    : "—"}
                  {" · "}
                  {req?.hospitalName ||
                    (req?.patientName
                      ? `For ${req.patientName}`
                      : "Blood request")}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {req?.component
                    ? (COMPONENT_LABELS[req.component] ?? req.component)
                    : "—"}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        id: "location",
        accessorFn: (r) => r.request?.city ?? "",
        header: "Location",
        cell: ({ row }) => (
          <span className="text-sm">
            {[row.original.request?.city, row.original.request?.state]
              .filter(Boolean)
              .join(", ") || "—"}
          </span>
        ),
      },
      {
        accessorKey: "unitsOffered",
        header: "Offered",
        cell: ({ row }) => (
          <span className="text-sm font-semibold text-primary">
            {row.original.unitsOffered}{" "}
            {row.original.unitsOffered === 1 ? "unit" : "units"}
          </span>
        ),
      },
      {
        accessorKey: "message",
        header: "Message",
        cell: ({ row }) => (
          <span className="block max-w-40 truncate text-xs text-muted-foreground">
            {row.original.message || "—"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={`${STATUS_STYLES[row.original.status]} text-xs`}
          >
            {STATUS_LABELS[row.original.status]}
          </Badge>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Responded",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="flex items-center justify-end gap-1.5">
              {r.request && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  asChild
                >
                  <Link href={`/notification/${r.request.id}`}>
                    <Eye className="h-3.5 w-3.5" />
                    View
                  </Link>
                </Button>
              )}
              {WITHDRAWABLE.includes(r.status) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => setWithdrawId(r.id)}
                >
                  <Undo2 className="h-3.5 w-3.5" />
                  Withdraw
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-2">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          My Responses
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every request you&apos;ve answered — and where each stands.
        </p>
      </div>

      {isPending && (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading your responses…
        </div>
      )}

      {error && !isPending && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            {error instanceof Error
              ? error.message
              : "Could not load your responses."}
          </CardContent>
        </Card>
      )}

      {!isPending && !error && responses.length === 0 && (
        <Card className="border-border/80 shadow-xs">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <HeartHandshake className="h-6 w-6" />
            </span>
            <p className="font-medium">No responses yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              When a blood request notification comes in, tap &quot;I Want to
              Help&quot; to respond.
            </p>
          </CardContent>
        </Card>
      )}

      {!isPending && !error && responses.length > 0 && (
        <GenericTable
          columns={columns}
          data={responses}
          sort
          filter
          filterColumn="request"
          filterPlaceHolder="Search requests…"
          pagination
        />
      )}

      <AppDialog
        open={!!withdrawId}
        onOpenChange={(v) => !v && setWithdrawId(null)}
        title="Withdraw response?"
        description="The institution will no longer see you as a donor for this request. You can respond again later if you change your mind."
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setWithdrawId(null)}
              disabled={withdrawMutation.isPending}
            >
              Keep it
            </Button>
            <Button
              variant="destructive"
              disabled={withdrawMutation.isPending}
              onClick={() =>
                withdrawId && withdrawMutation.mutate(withdrawId)
              }
              className="gap-2"
            >
              {withdrawMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Withdraw
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          This only removes your response to this request — your other
          responses are unaffected.
        </p>
      </AppDialog>
    </div>
  );
}
