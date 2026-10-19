"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";

import { donationsApi, MY_DONATIONS_KEY } from "@/api/donations.api";
import { profilesApi, PROFILES_DONOR_KEY } from "@/api/profiles.api";
import { requestsApi } from "@/api/requests.api";
import { responsesApi, MY_RESPONSES_KEY } from "@/api/responses.api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthUser } from "@/lib/use-auth-user";

import { posterDataFromRequest } from "../../requests/_lib/request-form";
import { RequestPoster } from "../../requests/_components/request-poster";
import { DonorStepsDialog } from "./donor-steps-dialog";

interface NotificationViewProps {
  requestId: string;
}

/** Full-page blood appeal shown when a donor opens a BLOOD_REQUEST notification. */
export function NotificationView({ requestId }: NotificationViewProps) {
  const { user } = useAuthUser();
  const [stepsOpen, setStepsOpen] = useState(false);

  const {
    data: request,
    isPending,
    error,
  } = useQuery({
    queryKey: ["notification", "request", requestId],
    queryFn: () =>
      requestsApi.getRequest(requestId).then((res) => res.request),
    retry: false,
  });

  const roleLower = (user?.role ?? "").toLowerCase();
  const isDonor = roleLower.includes("dona") || roleLower.includes("donor");
  const acceptingResponses =
    request?.status === "OPEN" || request?.status === "PARTIALLY_FULFILLED";

  // Step 1 — onboarding / donor profile gate.
  const { data: donorProfile, isFetching: profileFetching } = useQuery({
    queryKey: PROFILES_DONOR_KEY,
    queryFn: () =>
      profilesApi.getDonorProfile().then((res) => res.profile),
    enabled: isDonor,
    staleTime: 0,
  });
  const onboardingDone =
    !!donorProfile?.profileCompleted && donorProfile.isAvailable !== false;

  // Step 2 — donation screening for this request (Donation + DonationScreening).
  const { data: myDonations, isFetching: donationsFetching } = useQuery({
    queryKey: MY_DONATIONS_KEY,
    queryFn: () => donationsApi.listMine(),
    enabled: isDonor,
    staleTime: 0,
  });
  const donation = useMemo(
    () => myDonations?.data.find((d) => d.requestId === requestId),
    [myDonations, requestId]
  );
  const { data: screeningRes, isFetching: screeningFetching } = useQuery({
    queryKey: ["donations", donation?.id, "screening"],
    queryFn: () => donationsApi.getScreening(donation!.id),
    enabled: !!donation,
    staleTime: 0,
  });
  const screening = screeningRes?.screening;
  const screeningDone =
    !!screening &&
    !(
      screening.recentFever ||
      screening.alcoholWithin24Hours ||
      screening.currentlyUnwell ||
      screening.recentInfection ||
      screening.medicationChanges
    );

  // Step 3 — response already sent?
  const { data: myResponses } = useQuery({
    queryKey: MY_RESPONSES_KEY,
    queryFn: () => responsesApi.listMine({ limit: 100 }),
    enabled: isDonor,
    staleTime: 0,
  });
  const responded = useMemo(
    () =>
      !!myResponses?.data.some(
        (r) =>
          r.requestId === requestId &&
          r.status !== "CANCELLED" &&
          r.status !== "DECLINED"
      ),
    [myResponses, requestId]
  );

  const stepsPending =
    profileFetching || donationsFetching || screeningFetching;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {request?.requestType === "RECIPIENT"
              ? "Urgent Blood Appeal"
              : "Blood Request"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {request?.requestType === "RECIPIENT"
              ? "A recipient in need is looking for eligible donors — every drop counts."
              : "An institution is looking for donors — every drop counts."}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild className="shrink-0 gap-2">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      {isPending && (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading request details…
        </div>
      )}

      {error && !isPending && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center gap-2 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error instanceof Error
              ? error.message
              : "This request could not be found."}
          </CardContent>
        </Card>
      )}

      {request && !isPending && (
        <RequestPoster
          data={posterDataFromRequest(request)}
          onRespond={
            isDonor && acceptingResponses && !responded
              ? () => setStepsOpen(true)
              : undefined
          }
          respondPending={false}
          responded={responded}
        />
      )}

      {isDonor && (
        <DonorStepsDialog
          requestId={requestId}
          open={stepsOpen}
          onOpenChange={setStepsOpen}
          loading={stepsPending}
          onboardingDone={onboardingDone}
          screeningDone={screeningDone}
          responded={responded}
        />
      )}
    </div>
  );
}
