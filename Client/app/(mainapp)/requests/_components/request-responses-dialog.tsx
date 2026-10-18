"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CalendarClock,
  CheckCircle2,
  Droplet,
  HeartHandshake,
  Loader2,
  Mail,
  Phone,
  Sparkles,
} from "lucide-react";

import {
  DonorResponse,
  DonorResponseStatus,
  responsesApi,
} from "@/api/responses.api";
import { appointmentsApi } from "@/api/appointments.api";
import { requestsApi, REQUESTS_LIST_KEY } from "@/api/requests.api";
import { ApiRequestError } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppDialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  COMPLETED: "Donation Received",
  DECLINED: "Declined",
  CANCELLED: "Withdrawn",
};

const NEXT_STEP: Partial<
  Record<DonorResponseStatus, { status: DonorResponseStatus; label: string }>
> = {
  INTERESTED: { status: "CONTACTED", label: "Mark contacted" },
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

/** Recipient & Bank view — manage donor responses and receive blood units. */
export function RequestResponsesDialog({
  requestId,
  onClose,
}: RequestResponsesDialogProps) {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState<DonorResponse | null>(null);
  const [unitsReceived, setUnitsReceived] = useState<number>(1);

  // Fetch the request details to display real-time fulfillment progress
  const { data: requestRes } = useQuery({
    queryKey: ["requests", requestId],
    queryFn: () => requestsApi.getRequest(requestId!),
    enabled: !!requestId,
  });
  const request = requestRes?.request;

  const { data, isPending, error } = useQuery({
    queryKey: ["responses", "request", requestId],
    queryFn: () => responsesApi.listForRequest(requestId!, { limit: 100 }),
    enabled: !!requestId,
  });
  const responses = data?.data ?? [];

  // Appointments for this request
  const { data: apptData } = useQuery({
    queryKey: ["appointments", "request", requestId],
    queryFn: () => appointmentsApi.listForRequest(requestId!, { limit: 100 }),
    enabled: !!requestId,
  });
  const appointmentByDonor = new Map(
    (apptData?.data ?? [])
      .filter((a) => a.status === "SCHEDULED" || a.status === "CONFIRMED")
      .map((a) => [a.donorProfileId, a])
  );

  const advanceMutation = useMutation({
    mutationFn: (args: {
      id: string;
      status: DonorResponseStatus;
      unitsOffered?: number;
    }) =>
      responsesApi.updateResponse(args.id, {
        status: args.status,
        unitsOffered: args.unitsOffered,
        ...(args.status === "CONTACTED"
          ? { contactedAt: new Date().toISOString() }
          : {}),
      }),
    onSuccess: (_, variables) => {
      if (variables.status === "COMPLETED") {
        toast.success("Donation received & confirmed!", {
          description:
            "Request units updated and other donors have been notified.",
        });
      } else {
        toast.success("Response updated");
      }
      queryClient.invalidateQueries({
        queryKey: ["responses", "request", requestId],
      });
      queryClient.invalidateQueries({ queryKey: REQUESTS_LIST_KEY });
      queryClient.invalidateQueries({ queryKey: ["requests", requestId] });
      setConfirming(null);
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiRequestError
          ? err.message
          : "Could not update the response"
      ),
  });

  const unitsRequired = request?.unitsRequired ?? 0;
  const unitsFulfilled = request?.unitsFulfilled ?? 0;
  const unitsRemaining = Math.max(0, unitsRequired - unitsFulfilled);
  const progressPercent =
    unitsRequired > 0
      ? Math.min(100, Math.round((unitsFulfilled / unitsRequired) * 100))
      : 0;

  const handleOpenReceive = (r: DonorResponse) => {
    setConfirming(r);
    setUnitsReceived(r.unitsOffered || 1);
  };

  const handleConfirmReceive = () => {
    if (!confirming) return;
    advanceMutation.mutate({
      id: confirming.id,
      status: "COMPLETED",
      unitsOffered: unitsReceived,
    });
  };

  return (
    <>
      <AppDialog
        open={!!requestId}
        onOpenChange={(v) => !v && onClose()}
        size="lg"
        title="Donor Responses & Fulfillment"
        icon={<HeartHandshake className="h-5 w-5 text-primary" />}
        description="Review interested donors, contact them, and confirm received blood units to update your request progress."
      >
        {/* Real-time fulfillment progress banner */}
        {request && (
          <div className="mb-4 rounded-xl border border-border/80 bg-muted/30 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Fulfillment Status
                </p>
                <p className="text-sm font-bold text-foreground">
                  {request.patientName
                    ? `For ${request.patientName} (${BLOOD_GROUP_LABELS[request.bloodGroup] ?? request.bloodGroup})`
                    : `${BLOOD_GROUP_LABELS[request.bloodGroup] ?? request.bloodGroup} · ${request.hospitalName || request.city}`}
                </p>
                {request.reason && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Reason: {request.reason}
                  </p>
                )}
              </div>
              <Badge
                variant="outline"
                className={
                  unitsRemaining === 0
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                    : "bg-amber-500/10 text-amber-600 border-amber-500/30"
                }
              >
                {unitsRemaining === 0
                  ? "Fully Fulfilled"
                  : `${unitsRemaining} unit${unitsRemaining === 1 ? "" : "s"} needed`}
              </Badge>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-background p-2.5 border border-border/60 shadow-2xs">
                <span className="text-muted-foreground block text-[10px] font-medium">Required</span>
                <span className="font-display font-bold text-lg text-foreground">{unitsRequired}</span>
              </div>
              <div className="rounded-lg bg-background p-2.5 border border-border/60 shadow-2xs">
                <span className="text-muted-foreground block text-[10px] font-medium">Received</span>
                <span className="font-display font-bold text-lg text-emerald-600">{unitsFulfilled}</span>
              </div>
              <div className="rounded-lg bg-background p-2.5 border border-border/60 shadow-2xs">
                <span className="text-muted-foreground block text-[10px] font-medium">Still Needed</span>
                <span className="font-display font-bold text-lg text-rose-600">{unitsRemaining}</span>
              </div>
            </div>

            <div className="mt-3">
              <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                <span>Progress</span>
                <span className="font-semibold text-foreground">{progressPercent}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        )}

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
            No donors have responded yet. Notifications have been dispatched to matching donors in the area.
          </p>
        )}

        <ul className="divide-y divide-border/60">
          {responses.map((r) => {
            const next = NEXT_STEP[r.status];
            const isCompleted = r.status === "COMPLETED";
            const canReceive =
              r.status !== "COMPLETED" &&
              r.status !== "CANCELLED" &&
              r.status !== "DECLINED";

            return (
              <li key={r.id} className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-start">
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
                    · Responded {formatDate(r.createdAt)}
                  </p>
                  {r.message && (
                    <p className="text-xs italic text-muted-foreground">
                      &quot;{r.message}&quot;
                    </p>
                  )}
                  {(r.donor?.user?.personalProfile?.phoneNumber ||
                    r.donor?.user?.email) && (
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                      {r.donor?.user?.personalProfile?.phoneNumber && (
                        <a
                          href={`tel:${r.donor.user.personalProfile.phoneNumber}`}
                          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                        >
                          <Phone className="h-3 w-3" />
                          {r.donor.user.personalProfile.phoneNumber}
                        </a>
                      )}
                      {r.donor?.user?.email && (
                        <a
                          href={`mailto:${r.donor.user.email}`}
                          className="inline-flex items-center gap-1 text-muted-foreground hover:underline"
                        >
                          <Mail className="h-3 w-3" />
                          {r.donor.user.email}
                        </a>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 sm:shrink-0">
                  {(r.status === "INTERESTED" || r.status === "CONTACTED") && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1.5 text-xs"
                      asChild
                    >
                      <Link
                        href={`/appointments/create?request=${r.requestId}&donor=${r.donorProfileId}&name=${encodeURIComponent(r.donor?.user?.name ?? "")}`}
                      >
                        <CalendarClock className="h-3.5 w-3.5" />
                        Schedule
                      </Link>
                    </Button>
                  )}
                  {r.status === "APPOINTMENT_SCHEDULED" &&
                    appointmentByDonor.get(r.donorProfileId) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 gap-1.5 text-xs"
                        asChild
                      >
                        <Link
                          href={`/appointments/${appointmentByDonor.get(r.donorProfileId)!.id}/edit?request=${r.requestId}&name=${encodeURIComponent(r.donor?.user?.name ?? "")}`}
                        >
                          <CalendarClock className="h-3.5 w-3.5" />
                          Reschedule
                        </Link>
                      </Button>
                    )}
                  {next && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      disabled={advanceMutation.isPending}
                      onClick={() =>
                        advanceMutation.mutate({ id: r.id, status: next.status })
                      }
                    >
                      {next.label}
                    </Button>
                  )}
                  {canReceive && (
                    <Button
                      size="sm"
                      className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                      disabled={advanceMutation.isPending}
                      onClick={() => handleOpenReceive(r)}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Receive Donation
                    </Button>
                  )}
                  {isCompleted && (
                    <span className="flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Fulfilled ({r.unitsOffered}u)
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </AppDialog>

      {/* Confirmation modal to receive donation units */}
      <AppDialog
        open={!!confirming}
        onOpenChange={(v) => !v && setConfirming(null)}
        size="lg"
        title="Confirm Blood Units Received"
        icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
        description={`Record units received from ${confirming?.donor?.user?.name ?? "this donor"}. This will update your request progress and broadcast remaining unit requirements to other donors.`}
      >
        <div className="space-y-4 py-2">
          <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5 space-y-1 text-xs">
            <p className="font-semibold text-foreground">
              Donor: {confirming?.donor?.user?.name ?? "Donor"}
            </p>
            <p className="text-muted-foreground">
              Blood Group: {confirming?.donor?.bloodGroup ? (BLOOD_GROUP_LABELS[confirming.donor.bloodGroup] ?? confirming.donor.bloodGroup) : "—"} · Offered: {confirming?.unitsOffered ?? 1} unit(s)
            </p>
            {confirming?.message && (
              <p className="italic text-muted-foreground pt-1">
                &quot;{confirming.message}&quot;
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="units-received" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Units Donated / Received
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="units-received"
                type="number"
                min={1}
                max={10}
                value={unitsReceived}
                onChange={(e) => setUnitsReceived(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-24 text-center font-bold"
              />
              <span className="text-xs text-muted-foreground">
                units will be added to request fulfillment
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground flex items-start gap-2">
            <Sparkles className="h-4 w-4 shrink-0 text-primary mt-0.5" />
            <p>
              Once confirmed, this donor will receive a verified donation certificate in their portal, and other donors will be updated on the remaining {Math.max(0, unitsRemaining - unitsReceived)} needed units.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setConfirming(null)}>
              Cancel
            </Button>
            <Button
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={advanceMutation.isPending}
              onClick={handleConfirmReceive}
            >
              {advanceMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Confirm &amp; Receive {unitsReceived} Unit{unitsReceived === 1 ? "" : "s"}
            </Button>
          </div>
        </div>
      </AppDialog>
    </>
  );
}
