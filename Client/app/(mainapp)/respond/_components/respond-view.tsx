"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  HeartHandshake,
  Loader2,
  Send,
  ShieldAlert,
  TriangleAlert,
} from "lucide-react";

import { donationsApi, MY_DONATIONS_KEY } from "@/api/donations.api";
import { profilesApi, PROFILES_DONOR_KEY } from "@/api/profiles.api";
import { requestsApi } from "@/api/requests.api";
import { responsesApi, MY_RESPONSES_KEY } from "@/api/responses.api";
import { ApiRequestError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldError } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BLOOD_GROUP_LABELS } from "@/app/(mainapp)/requests/_lib/request-form";

const TEXTAREA_CLASSES =
  "flex min-h-20 w-full rounded-lg border border-input bg-card px-3 py-2 text-base shadow-2xs transition-all placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

interface RespondViewProps {
  requestId: string;
}

/** Final donor step — only reachable once onboarding + donation screening pass. */
export function RespondView({ requestId }: RespondViewProps) {
  const [units, setUnits] = useState("1");
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const requestQuery = useQuery({
    queryKey: ["requests", requestId],
    queryFn: () => requestsApi.getRequest(requestId),
    retry: false,
  });
  const request = requestQuery.data?.request;

  const profileQuery = useQuery({
    queryKey: PROFILES_DONOR_KEY,
    queryFn: () => profilesApi.getDonorProfile().then((res) => res.profile),
    retry: false,
  });
  const donorProfile = profileQuery.data;

  const donationsQuery = useQuery({
    queryKey: MY_DONATIONS_KEY,
    queryFn: () => donationsApi.listMine(),
    enabled: !!donorProfile,
  });
  const donation = useMemo(
    () => donationsQuery.data?.data.find((d) => d.requestId === requestId),
    [donationsQuery.data, requestId]
  );

  const screeningQuery = useQuery({
    queryKey: ["donations", donation?.id, "screening"],
    queryFn: () => donationsApi.getScreening(donation!.id),
    enabled: !!donation,
  });
  const screening = screeningQuery.data?.screening;
  const screeningDone = !!screening;
  const screeningClear =
    screeningDone &&
    !(
      screening?.recentFever ||
      screening?.alcoholWithin24Hours ||
      screening?.currentlyUnwell ||
      screening?.recentInfection ||
      screening?.medicationChanges
    );

  const responsesQuery = useQuery({
    queryKey: MY_RESPONSES_KEY,
    queryFn: () => responsesApi.listMine({ limit: 100 }),
    enabled: !!donorProfile,
  });
  const alreadyResponded = useMemo(
    () =>
      responsesQuery.data?.data.some(
        (r) =>
          r.requestId === requestId &&
          r.status !== "CANCELLED" &&
          r.status !== "DECLINED"
      ),
    [responsesQuery.data, requestId]
  );

  const onboardingDone =
    !!donorProfile?.profileCompleted && donorProfile.isAvailable !== false;

  const respondMutation = useMutation({
    mutationFn: () =>
      responsesApi.createResponse({
        requestId,
        unitsOffered: Number(units) || 1,
        message: message.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("Response sent", {
        description:
          request?.requestType === "RECIPIENT"
            ? "The recipient and family have been notified and can contact you to coordinate."
            : "The institution can now contact you to schedule the donation.",
      });
      setSent(true);
    },
    onError: (err) => {
      if (err instanceof ApiRequestError) {
        if (err.code === "ALREADY_RESPONDED") {
          setFormError("You have already responded to this request.");
          return;
        }
        if (err.code === "REQUEST_CLOSED") {
          setFormError("This request is no longer accepting responses.");
          return;
        }
        setFormError(err.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    },
  });

  const loading =
    requestQuery.isLoading ||
    profileQuery.isLoading ||
    donationsQuery.isLoading ||
    responsesQuery.isLoading ||
    screeningQuery.isLoading;

  const bloodGroupLabel = request
    ? (BLOOD_GROUP_LABELS[request.bloodGroup] ?? request.bloodGroup)
    : "";

  function gateCard(opts: {
    icon: React.ReactNode;
    title: string;
    body: string;
    action?: { href: string; label: string };
  }) {
    return (
      <Card className="border-border/80 shadow-xs">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          {opts.icon}
          <p className="text-base font-semibold">{opts.title}</p>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            {opts.body}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href={`/notification/${requestId}`}>Back to request</Link>
            </Button>
            {opts.action && (
              <Button asChild>
                <Link href={opts.action.href}>{opts.action.label}</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  let body: React.ReactNode;
  if (loading) {
    body = (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  } else if (!onboardingDone) {
    body = gateCard({
      icon: <ShieldAlert className="h-10 w-10 text-amber-500" />,
      title: "Finish onboarding first",
      body: "Complete your donor onboarding before you can respond to blood requests.",
      action: { href: "/onboarding/donor", label: "Go to onboarding" },
    });
  } else if (!screeningDone) {
    body = gateCard({
      icon: <ShieldAlert className="h-10 w-10 text-amber-500" />,
      title: "Donation screening required",
      body: "Answer the pre-donation health questions before responding.",
      action: {
        href: `/notification/${requestId}/screening`,
        label: "Fill screening",
      },
    });
  } else if (!screeningClear) {
    body = gateCard({
      icon: <TriangleAlert className="h-10 w-10 text-amber-500" />,
      title: "Not eligible right now",
      body: "Your screening answers show you can't donate at this time. You can respond once you're eligible.",
    });
  } else if (sent || alreadyResponded) {
    body = gateCard({
      icon: <CheckCircle2 className="h-10 w-10 text-emerald-500" />,
      title: sent ? "Response sent" : "Response already sent",
      body:
        request?.requestType === "RECIPIENT"
          ? "The recipient and their family have your response — they will contact you to coordinate the donation."
          : "The institution has your response — they'll contact you to schedule the donation.",
      action: { href: "/responses", label: "View my responses" },
    });
  } else {
    const isRecipientReq = request?.requestType === "RECIPIENT";
    body = (
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <HeartHandshake className="h-5 w-5 text-primary" />
            Respond to Request
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {request
              ? `Let them know you can help with the ${bloodGroupLabel} ${isRecipientReq ? "appeal" : "request"} in ${request.city}${isRecipientReq && request.patientName ? ` for ${request.patientName}` : ""}${request.reason ? ` (${request.reason})` : ""}.`
              : "Let them know you can help."}{" "}
            They will contact you to coordinate the donation.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Units You Can Donate
            </Label>
            <Select value={units} onValueChange={setUnits}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} {n === 1 ? "unit" : "units"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="response-message"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Message{" "}
              <span className="font-normal normal-case">
                (optional, max 500 chars)
              </span>
            </Label>
            <textarea
              id="response-message"
              className={TEXTAREA_CLASSES}
              placeholder="e.g. I can come to the hospital tomorrow morning…"
              maxLength={500}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <FieldError message={formError ?? undefined} />

          <div className="flex justify-end gap-2">
            <Button variant="ghost" asChild>
              <Link href={`/notification/${requestId}`}>Not now</Link>
            </Button>
            <Button
              onClick={() => respondMutation.mutate()}
              disabled={respondMutation.isPending}
              className="gap-2"
            >
              {respondMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send Response
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/notification/${requestId}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Donor Response
          </h1>
          <p className="text-sm text-muted-foreground">
            {request
              ? `${bloodGroupLabel} ${request.requestType === "RECIPIENT" ? "appeal" : "request"} · ${request.city}`
              : "Offer your support to help save a life"}
          </p>
        </div>
      </div>

      <div className="grid items-stretch gap-6 lg:grid-cols-2">
        <div>{body}</div>

        {/* Donation art card — stretches to match the form card's height */}
        <Card className="hidden overflow-hidden border-border/80 shadow-xs lg:flex lg:flex-col lg:sticky lg:top-6">
          <div className="relative min-h-72 flex-1">
            <Image
              src="/responding.jpg"
              alt="Blood bags for groups A, AB, B and O, and a donor's arm connected to a heart"
              fill
              sizes="(min-width: 1024px) 40rem, 100vw"
              className="object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
          </div>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <HeartHandshake className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                One donation. Three lives.
              </p>
              <p className="text-xs text-muted-foreground">
                Every drop counts.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
