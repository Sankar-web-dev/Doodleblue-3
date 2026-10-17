"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  Loader2,
  MapPin,
  StickyNote,
} from "lucide-react";

import { appointmentsApi } from "@/api/appointments.api";
import { ApiRequestError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EditAppointmentViewProps {
  appointmentId: string;
  /** Set when the bank edits from a request context; empty for donor edits. */
  requestId: string;
  donorName: string;
}

const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Reschedule / edit an existing appointment — bank (via request) or donor (own). */
export function EditAppointmentView({
  appointmentId,
  requestId,
  donorName,
}: EditAppointmentViewProps) {
  const queryClient = useQueryClient();
  const backHref = requestId ? "/requests" : "/appointments";
  const backLabel = requestId ? "Requests" : "My appointments";

  // Bank edits resolve through the request's appointment list; donor edits
  // resolve through their own list.
  const { data: appointment, isPending, error } = useQuery({
    queryKey: ["appointments", "edit", appointmentId],
    queryFn: async () => {
      const res = requestId
        ? await appointmentsApi.listForRequest(requestId, { limit: 100 })
        : await appointmentsApi.listMine({ limit: 100 });
      return res.data.find((a) => a.id === appointmentId) ?? null;
    },
  });

  const [scheduledAt, setScheduledAt] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Prefill once the appointment loads (render-time adjust).
  if (appointment && !hydrated) {
    setHydrated(true);
    setScheduledAt(toLocalInput(appointment.scheduledAt));
    setLocation(appointment.location ?? "");
    setNotes(appointment.notes ?? "");
  }

  const mutation = useMutation({
    mutationFn: () =>
      appointmentsApi.update(appointmentId, {
        scheduledAt: new Date(scheduledAt).toISOString(),
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
      }),
    onSuccess: () => {
      setDone(true);
      toast.success("Appointment updated");
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["responses"] });
    },
    onError: (err) =>
      setFormError(
        err instanceof ApiRequestError
          ? err.message
          : "Could not update the appointment."
      ),
  });

  if (isPending) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading appointment…
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="flex w-full flex-col items-center gap-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">
          {error instanceof Error
            ? error.message
            : "This appointment could not be found."}
        </p>
        <Button variant="outline" asChild>
          <Link href={backHref}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {backLabel}
          </Link>
        </Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex w-full flex-col items-center gap-4 py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Appointment updated
        </h1>
        <p className="text-sm text-muted-foreground">
          The new slot details are saved.
        </p>
        <Button variant="outline" asChild>
          <Link href={backHref}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {backLabel}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2 mb-2" asChild>
          <Link href={backHref}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            {backLabel}
          </Link>
        </Button>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Reschedule appointment
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update the donation slot
          {donorName ? (
            <>
              {" "}
              for{" "}
              <span className="font-semibold text-foreground">{donorName}</span>
            </>
          ) : (
            ""
          )}
          .
        </p>
      </div>

      <Card className="border-border/80 shadow-xs">
        <CardContent className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label
              htmlFor="scheduled-at"
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              <CalendarClock className="h-3.5 w-3.5" />
              Date &amp; time
            </Label>
            <Input
              id="scheduled-at"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="location"
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              <MapPin className="h-3.5 w-3.5" />
              Location (optional)
            </Label>
            <Input
              id="location"
              placeholder="e.g. City Hospital — Block B, Blood Bank"
              maxLength={200}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label
              htmlFor="notes"
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              <StickyNote className="h-3.5 w-3.5" />
              Notes (optional)
            </Label>
            <textarea
              id="notes"
              rows={3}
              maxLength={1000}
              placeholder="Instructions for the donor — documents to carry, preparation tips…"
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {formError && (
            <p className="text-sm text-destructive sm:col-span-2">{formError}</p>
          )}

          <Button
            className="w-full gap-2 sm:col-span-2"
            disabled={!scheduledAt || mutation.isPending}
            onClick={() => {
              setFormError(null);
              if (new Date(scheduledAt).getTime() <= Date.now()) {
                setFormError("Pick a date and time in the future.");
                return;
              }
              mutation.mutate();
            }}
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CalendarCheck className="h-4 w-4" />
            )}
            Save changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
