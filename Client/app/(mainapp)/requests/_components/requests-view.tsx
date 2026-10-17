"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  Ban,
  CalendarClock,
  CheckCircle2,
  Droplet,
  Eye,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";

import type { BloodRequest, BloodRequestStatus } from "@/api/requests.api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import GenericTable from "@/components/ui/generic-table";

import { useAuthUser } from "@/lib/use-auth-user";
import { ForbiddenState } from "../../_components/forbidden-state";

import {
  useMyRequests,
  useSetRequestStatus,
} from "../_hooks/use-requests";
import {
  BLOOD_GROUP_LABELS,
  COMPONENT_LABELS,
  STATUS_LABELS,
  URGENCY_LABELS,
  posterDataFromRequest,
} from "../_lib/request-form";
import { CancelRequestDialog } from "./cancel-request-dialog";
import { RequestPreviewDialog } from "./request-preview-dialog";
import { RequestResponsesDialog } from "./request-responses-dialog";

const STATUS_STYLES: Record<BloodRequestStatus, string> = {
  OPEN: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  PARTIALLY_FULFILLED: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  FULFILLED: "bg-muted text-muted-foreground border-border/40",
  CANCELLED: "bg-destructive/10 text-destructive border-destructive/20",
  EXPIRED: "bg-muted text-muted-foreground border-border/40",
};

const URGENCY_STYLES: Record<string, string> = {
  EMERGENCY: "bg-red-500/10 text-red-600 border-red-500/20",
  WITHIN_24_HOURS: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  SCHEDULED: "bg-blue-500/10 text-blue-600 border-blue-500/20",
};

const OPEN_STATUSES: BloodRequestStatus[] = ["OPEN", "PARTIALLY_FULFILLED"];

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function RequestsView() {
  const { user, isPending: userPending } = useAuthUser();
  const [posterRequest, setPosterRequest] = useState<BloodRequest | null>(null);
  const [cancelTarget, setCancelTarget] = useState<BloodRequest | null>(null);
  const [responsesRequestId, setResponsesRequestId] = useState<string | null>(
    null
  );

  const roleLower = (user?.role || "").toLowerCase();
  const allowed = roleLower.includes("bank") || user?.role === "SUPER_ADMIN";

  const { data, isPending, error, refetch } = useMyRequests();
  const requests = useMemo(() => data?.data ?? [], [data]);

  const statusMutation = useSetRequestStatus();
  const setStatus = (id: string, status: BloodRequestStatus, label: string) =>
    statusMutation.mutate(
      { id, status },
      {
        onSuccess: () => toast.success(`Request ${label}`),
        onError: (err) =>
          toast.error("Status update failed", {
            description:
              err instanceof Error ? err.message : "Please try again.",
          }),
      }
    );

  const columns = useMemo<ColumnDef<BloodRequest, unknown>[]>(
    () => [
      {
        accessorKey: "bloodGroup",
        header: "Requirement",
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="flex items-center gap-3 py-1">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Droplet className="h-4 w-4 fill-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {BLOOD_GROUP_LABELS[r.bloodGroup] ?? r.bloodGroup} ·{" "}
                  {r.unitsRequired}{" "}
                  {r.unitsRequired === 1 ? "unit" : "units"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {COMPONENT_LABELS[r.component] ?? r.component}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "urgency",
        header: "Urgency",
        cell: ({ row }) => (
          <Badge className={`${URGENCY_STYLES[row.original.urgency]} text-xs`}>
            {URGENCY_LABELS[row.original.urgency]}
          </Badge>
        ),
      },
      {
        accessorKey: "requiredBy",
        header: "Required By",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarClock className="h-3.5 w-3.5" />
            {formatDate(row.original.requiredBy)}
          </div>
        ),
      },
      {
        accessorKey: "city",
        header: "Location",
        cell: ({ row }) => (
          <span className="text-sm">
            {[row.original.city, row.original.state]
              .filter(Boolean)
              .join(", ")}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="space-y-1">
              <Badge className={`${STATUS_STYLES[r.status]} text-xs`}>
                {STATUS_LABELS[r.status]}
              </Badge>
              {r.unitsFulfilled > 0 && (
                <p className="text-[11px] text-muted-foreground">
                  {r.unitsFulfilled}/{r.unitsRequired} units collected
                </p>
              )}
            </div>
          );
        },
      },
      {
        id: "responses",
        header: "Responses",
        enableSorting: false,
        cell: ({ row }) => {
          const count = row.original._count?.responses ?? 0;
          return (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2 text-xs"
              disabled={count === 0}
              onClick={() => setResponsesRequestId(row.original.id)}
            >
              <span className="font-semibold">{count}</span>
              {count > 0 && <Eye className="ml-1.5 h-3.5 w-3.5" />}
            </Button>
          );
        },
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        enableSorting: false,
        cell: ({ row }) => {
          const r = row.original;
          const isOpen = OPEN_STATUSES.includes(r.status);
          return (
            <div className="flex items-center justify-end gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs"
                onClick={() => setPosterRequest(r)}
              >
                <Eye className="mr-1.5 h-3.5 w-3.5" />
                Poster
              </Button>
              {isOpen && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs"
                  asChild
                >
                  <Link href={`/requests/${r.id}/edit`}>
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Edit
                  </Link>
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">More actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {isOpen && (
                    <DropdownMenuItem
                      onClick={() =>
                        setStatus(r.id, "FULFILLED", "marked fulfilled")
                      }
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Mark fulfilled
                    </DropdownMenuItem>
                  )}
                  {(r.status === "CANCELLED" || r.status === "EXPIRED") && (
                    <DropdownMenuItem
                      onClick={() => setStatus(r.id, "OPEN", "reopened")}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reopen
                    </DropdownMenuItem>
                  )}
                  {r.status !== "CANCELLED" && r.status !== "FULFILLED" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setCancelTarget(r)}
                      >
                        <Ban className="mr-2 h-4 w-4" />
                        Cancel request
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  if (userPending) return null;
  if (!allowed) {
    return (
      <ForbiddenState message="Blood requests can only be managed by blood bank accounts." />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Blood Requests
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create and manage blood appeals posted by your institution.
          </p>
        </div>
        <Button asChild className="gap-2 self-start sm:self-auto">
          <Link href="/requests/create">
            <Plus className="h-4 w-4" />
            New Request
          </Link>
        </Button>
      </div>

      {/* Loading */}
      {isPending && (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading requests…
        </div>
      )}

      {/* Error */}
      {error && !isPending && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error instanceof Error
                ? error.message
                : "Failed to load requests."}
            </div>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {!isPending && !error && (
        <GenericTable
          columns={columns}
          data={requests}
          sort
          filter
          filterColumn="city"
          filterPlaceHolder="Search by city…"
          pagination
        />
      )}

      {/* Poster preview */}
      <RequestPreviewDialog
        open={!!posterRequest}
        onClose={() => setPosterRequest(null)}
        data={posterRequest ? posterDataFromRequest(posterRequest) : null}
      />

      {/* Donor responses */}
      <RequestResponsesDialog
        requestId={responsesRequestId}
        onClose={() => setResponsesRequestId(null)}
      />

      {/* Cancel confirm */}
      <CancelRequestDialog
        request={cancelTarget}
        onClose={() => setCancelTarget(null)}
      />
    </div>
  );
}
