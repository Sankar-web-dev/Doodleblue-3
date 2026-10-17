"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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

interface ScheduleViewProps {
  requestId: string;
  donorProfileId: string;
  donorName: string;
}

/** Blood bank schedules a donation slot for a responding donor. */
export function ScheduleView({
  requestId,
  donorProfileId,
  donorName,
}: ScheduleViewProps) {
  const queryClient = useQueryClient();
  const [scheduledAt, setScheduledAt] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      appointmentsApi.create({
        requestId,
        donorProfileId,
        scheduledAt: new Date(scheduledAt).toISOString(),
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
      }),
    onSuccess: () => {
      setDone(true);
      toast.success("Appointment scheduled", {
        description: "The donor has been notified.",
      });
      queryClient.invalidateQueries({ queryKey: ["responses"] });
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (err) =>
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Could not schedule the appointment."
      ),
  });

  if (!requestId || !donorProfileId) {
    return (
      <div className="flex w-full flex-col items-center gap-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">
          Missing request or donor details — open the schedule page from a
          donor response.
        </p>
        <Button variant="outline" asChild>
          <Link href="/requests">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to requests
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
          Appointment scheduled
        </h1>
        <p className="text-sm text-muted-foreground">
          {donorName || "The donor"} has been notified and their response is now
          marked &quot;Appointment scheduled&quot;.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/requests">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to requests
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2 mb-2" asChild>
          <Link href="/requests">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Requests
          </Link>
        </Button>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Schedule appointment
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a donation slot for{" "}
          <span className="font-semibold text-foreground">
            {donorName || "the donor"}
          </span>
          . They&apos;ll get a notification with these details.
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

          {error && (
            <p className="text-sm text-destructive sm:col-span-2">{error}</p>
          )}

          <Button
            className="w-full gap-2 sm:col-span-2"
            disabled={!scheduledAt || mutation.isPending}
            onClick={() => {
              setError(null);
              if (new Date(scheduledAt).getTime() <= Date.now()) {
                setError("Pick a date and time in the future.");
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
            Schedule appointment
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
