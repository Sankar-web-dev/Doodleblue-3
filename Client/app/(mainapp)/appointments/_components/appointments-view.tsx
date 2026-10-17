"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
import {
  CalendarClock,
  Droplet,
  Eye,
  Loader2,
  MapPin,
  Pencil,
  XCircle,
} from "lucide-react";

import {
  Appointment,
  AppointmentStatus,
  appointmentsApi,
  MANAGE_APPOINTMENTS_KEY,
  MY_APPOINTMENTS_KEY,
} from "@/api/appointments.api";
import { ApiRequestError } from "@/lib/api";
import { useAuthUser } from "@/lib/use-auth-user";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AppDialog } from "@/components/ui/dialog";
import GenericTable from "@/components/ui/generic-table";
import { BLOOD_GROUP_LABELS } from "@/app/(mainapp)/requests/_lib/request-form";

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  SCHEDULED: "bg-indigo-500/10 text-indigo-700 border-indigo-500/30",
  CONFIRMED: "bg-blue-500/10 text-blue-700 border-blue-500/30",
  COMPLETED: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  CANCELLED: "bg-muted text-muted-foreground border-border",
  MISSED: "bg-amber-500/10 text-amber-700 border-amber-500/30",
};

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  SCHEDULED: "Scheduled",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  MISSED: "Missed",
};

const CANCELLABLE: AppointmentStatus[] = ["SCHEDULED", "CONFIRMED"];

const formatDateTime = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return {
    date: d.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    time: d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }),
  };
};

/** Appointments — donor sees their own slots; a blood bank sees slots on its requests. */
export function AppointmentsView() {
  const queryClient = useQueryClient();
  const [cancelId, setCancelId] = useState<string | null>(null);
  const { user } = useAuthUser();
  const isBank = (user?.role ?? "").toLowerCase().includes("bank");
  const listKey = isBank ? MANAGE_APPOINTMENTS_KEY : MY_APPOINTMENTS_KEY;

  const { data, isPending, error } = useQuery({
    queryKey: listKey,
    queryFn: () =>
      isBank
        ? appointmentsApi.listManage({ limit: 100 })
        : appointmentsApi.listMine({ limit: 100 }),
    staleTime: 0,
  });
  const appointments = useMemo(() => data?.data ?? [], [data]);

  const cancelMutation = useMutation({
    mutationFn: (id: string) => appointmentsApi.cancel(id),
    onSuccess: () => {
      toast.success("Appointment cancelled");
      setCancelId(null);
      queryClient.invalidateQueries({ queryKey: listKey });
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiRequestError
          ? err.message
          : "Could not cancel the appointment"
      );
    },
  });

  const columns = useMemo<ColumnDef<Appointment, unknown>[]>(
    () => [
      {
        id: "scheduledAt",
        accessorKey: "scheduledAt",
        header: "Date & Time",
        cell: ({ row }) => {
          const dt = formatDateTime(row.original.scheduledAt);
          if (dt === "—") return <span className="text-sm">—</span>;
          return (
            <div className="py-1">
              <p className="text-sm font-semibold">{dt.date}</p>
              <p className="text-xs text-muted-foreground">{dt.time}</p>
            </div>
          );
        },
      },
      {
        id: "request",
        accessorFn: (a) => a.request?.bloodGroup ?? "",
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
                    : "Blood request"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {req?.hospitalName ?? req?.city ?? "—"}
                </p>
              </div>
            </div>
          );
        },
      },
      ...(isBank
        ? [
            {
              id: "donor",
              accessorFn: (a: Appointment) => a.donor?.user?.name ?? "",
              header: "Donor",
              cell: ({ row }: { row: { original: Appointment } }) => (
                <div className="flex items-center gap-2 py-1">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                    {(row.original.donor?.user?.name ?? "D")
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                  <span className="text-sm font-medium">
                    {row.original.donor?.user?.name ?? "Donor"}
                  </span>
                </div>
              ),
            } satisfies ColumnDef<Appointment, unknown>,
          ]
        : []),
      {
        accessorKey: "location",
        header: "Location",
        cell: ({ row }) => (
          <span className="flex items-center gap-1.5 text-sm">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            {row.original.location || row.original.request?.city || "—"}
          </span>
        ),
      },
      {
        accessorKey: "notes",
        header: "Notes",
        cell: ({ row }) => (
          <span className="block max-w-48 truncate text-xs text-muted-foreground">
            {row.original.notes || "—"}
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
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const a = row.original;
          return (
            <div className="flex items-center justify-end gap-1.5">
              {a.request && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  asChild
                >
                  <Link href={`/notification/${a.request.id}`}>
                    <Eye className="h-3.5 w-3.5" />
                    Request
                  </Link>
                </Button>
              )}
              {isBank && CANCELLABLE.includes(a.status) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  asChild
                >
                  <Link
                    href={`/appointments/${a.id}/edit?request=${a.requestId}&name=${encodeURIComponent(a.donor?.user?.name ?? "")}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Reschedule
                  </Link>
                </Button>
              )}
              {CANCELLABLE.includes(a.status) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => setCancelId(a.id)}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Cancel
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [isBank]
  );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-2">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          {isBank ? "Appointments" : "My Appointments"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isBank
            ? "Donation slots scheduled for donors on your requests."
            : "Donation slots scheduled for you by blood banks."}
        </p>
      </div>

      {isPending && (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading your appointments…
        </div>
      )}

      {error && !isPending && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            {error instanceof Error
              ? error.message
              : "Could not load your appointments."}
          </CardContent>
        </Card>
      )}

      {!isPending && !error && appointments.length === 0 && (
        <Card className="border-border/80 shadow-xs">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CalendarClock className="h-6 w-6" />
            </span>
            <p className="font-medium">No appointments yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {isBank
                ? "Open a request's donor responses and schedule a slot — it will appear here."
                : "When a blood bank schedules a slot for one of your responses, it will appear here and you'll get a notification."}
            </p>
          </CardContent>
        </Card>
      )}

      {!isPending && !error && appointments.length > 0 && (
        <GenericTable
          columns={columns}
          data={appointments}
          sort
          filter
          filterColumn="request"
          filterPlaceHolder="Search requests…"
          pagination
        />
      )}

      <AppDialog
        open={!!cancelId}
        onOpenChange={(v) => !v && setCancelId(null)}
        title="Cancel appointment?"
        description="The blood bank will see this slot as cancelled."
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setCancelId(null)}
              disabled={cancelMutation.isPending}
            >
              Keep it
            </Button>
            <Button
              variant="destructive"
              disabled={cancelMutation.isPending}
              onClick={() => cancelId && cancelMutation.mutate(cancelId)}
              className="gap-2"
            >
              {cancelMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Cancel appointment
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          If you can&apos;t make this slot, cancel so the blood bank knows —
          they can schedule a new one.
        </p>
      </AppDialog>
    </div>
  );
}
