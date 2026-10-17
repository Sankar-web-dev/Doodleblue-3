"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Eye,
  Loader2,
  RefreshCw,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import type { BloodBankListItem } from "@/api/blood-banks.api";
import type { VerificationStatus } from "@/api/profiles.api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import GenericTable from "@/components/ui/generic-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useAuthUser } from "@/lib/use-auth-user";
import { usePermissions } from "@/lib/permissions";
import { ForbiddenState } from "../../_components/forbidden-state";

import { useBloodBanks } from "../_hooks/use-blood-banks";
import { BloodBankDetailsSheet } from "./blood-bank-details-sheet";
import {
  VerifyBloodBankDialog,
  type VerifyTarget,
} from "./verify-blood-bank-dialog";

const STATUS_STYLES: Record<VerificationStatus, string> = {
  PENDING: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  VERIFIED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  REJECTED: "bg-destructive/10 text-destructive border-destructive/20",
  SUSPENDED: "bg-muted text-muted-foreground border-border/40",
};

const STATUS_OPTIONS: { label: string; value: VerificationStatus | "ALL" }[] = [
  { label: "All statuses", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Verified", value: "VERIFIED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Suspended", value: "SUSPENDED" },
];

export function BloodBanksView() {
  const { user, isPending: userPending } = useAuthUser();
  const { can } = usePermissions(user);
  const [viewBankId, setViewBankId] = useState<string | null>(null);
  const [verifyTarget, setVerifyTarget] = useState<VerifyTarget | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    VerificationStatus | "ALL"
  >("ALL");

  const { data, isPending, error, refetch } = useBloodBanks(
    statusFilter === "ALL" ? undefined : statusFilter
  );
  const banks = data?.data ?? [];
  // Look up from the latest query data so the sheet reflects status changes.
  const viewBank =
    banks.find((b) => b.id === viewBankId) ?? null;

  const columns = useMemo<ColumnDef<BloodBankListItem, unknown>[]>(
    () => [
      {
        accessorKey: "institutionName",
        header: "Institution",
        cell: ({ row }) => (
          <div className="flex items-center gap-3 py-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {row.original.institutionName}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {[row.original.city, row.original.state]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "contact",
        header: "Primary Contact",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate text-sm">{row.original.contactPersonName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {row.original.contactPhone}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "registrationNumber",
        header: "Registration",
        cell: ({ row }) => (
          <span className="text-xs font-mono text-muted-foreground">
            {row.original.registrationNumber || "—"}
          </span>
        ),
      },
      {
        accessorKey: "verificationStatus",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.verificationStatus ?? "PENDING";
          return (
            <Badge className={`${STATUS_STYLES[status]} text-xs`}>
              {status === "VERIFIED" && (
                <CheckCircle2 className="h-3 w-3 mr-1" />
              )}
              {status}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs"
              onClick={() => setViewBankId(row.original.id ?? null)}
            >
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              Review
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  if (userPending) return null;
  if (!can("users", "read")) {
    return (
      <ForbiddenState message="You don't have permission to view blood banks." />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Blood Banks
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review institution registrations and approve or reject
            verification.
          </p>
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) =>
            setStatusFilter(v as VerificationStatus | "ALL")
          }
        >
          <SelectTrigger className="h-9 w-40 shrink-0 self-start sm:self-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loading */}
      {isPending && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading blood banks…
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
                : "Failed to load blood banks."}
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
          data={banks}
          sort
          filter
          filterColumn="institutionName"
          filterPlaceHolder="Search institutions…"
          pagination
        />
      )}

      {/* Details + verification sheet */}
      <BloodBankDetailsSheet
        bank={viewBank}
        canVerify={can("users", "update")}
        onClose={() => setViewBankId(null)}
        onVerify={(target) => setVerifyTarget(target)}
      />

      {/* Confirm dialog */}
      <VerifyBloodBankDialog
        target={verifyTarget}
        onClose={() => setVerifyTarget(null)}
      />
    </div>
  );
}
