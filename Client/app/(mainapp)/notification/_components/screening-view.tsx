"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  ClipboardCheck,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

import { donationsApi, MY_DONATIONS_KEY } from "@/api/donations.api";
import { profilesApi, PROFILES_DONOR_KEY } from "@/api/profiles.api";
import { requestsApi } from "@/api/requests.api";
import { YesNoField } from "@/app/onboarding/_components/yes-no-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ApiRequestError } from "@/lib/api";
import { BLOOD_GROUP_LABELS } from "@/app/(mainapp)/requests/_lib/request-form";

const QUESTIONS = [
  {
    key: "recentFever",
    title: "Fever in the last 7 days?",
    description: "Recent fever, chills, or flu-like illness.",
  },
  {
    key: "alcoholWithin24Hours",
    title: "Alcohol in the last 24 hours?",
    description: "Any alcoholic drink in the past day.",
  },
  {
    key: "currentlyUnwell",
    title: "Feeling unwell right now?",
    description: "Any current illness, pain, or weakness.",
  },
  {
    key: "recentInfection",
    title: "Recent infection?",
    description: "An infection, or antibiotics taken recently.",
  },
  {
    key: "medicationChanges",
    title: "Medication changes?",
    description: "Started, stopped, or changed medication recently.",
  },
] as const;

type QuestionKey = (typeof QUESTIONS)[number]["key"];
type Answers = Partial<Record<QuestionKey, boolean>>;

const TEXTAREA_CLASSES =
  "flex min-h-20 w-full rounded-lg border border-input bg-card px-3 py-2 text-base shadow-2xs transition-all placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

interface ScreeningViewProps {
  requestId: string;
}

export function ScreeningView({ requestId }: ScreeningViewProps) {
  const [answers, setAnswers] = useState<Answers>({});
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [prefilled, setPrefilled] = useState(false);
  const [ineligible, setIneligible] = useState(false);

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
  const existingScreening = screeningQuery.data?.screening;

  // Prefill the form once an existing screening arrives.
  if (existingScreening && !prefilled) {
    setAnswers({
      recentFever: existingScreening.recentFever ?? undefined,
      alcoholWithin24Hours: existingScreening.alcoholWithin24Hours ?? undefined,
      currentlyUnwell: existingScreening.currentlyUnwell ?? undefined,
      recentInfection: existingScreening.recentInfection ?? undefined,
      medicationChanges: existingScreening.medicationChanges ?? undefined,
    });
    setNotes(existingScreening.additionalNotes ?? "");
    setSubmitted(true);
    setIneligible(
      !!(
        existingScreening.recentFever ||
        existingScreening.alcoholWithin24Hours ||
        existingScreening.currentlyUnwell ||
        existingScreening.recentInfection ||
        existingScreening.medicationChanges
      )
    );
    setPrefilled(true);
  }

  const allAnswered = QUESTIONS.every((q) => answers[q.key] !== undefined);
  const anyRisk = QUESTIONS.some((q) => answers[q.key] === true);

  const bloodGroupLabel = request
    ? (BLOOD_GROUP_LABELS[request.bloodGroup] ?? request.bloodGroup)
    : "";

  async function handleSubmit() {
    if (!allAnswered || !donorProfile) return;
    setSubmitting(true);
    try {
      let donationId = donation?.id;
      if (!donationId) {
        const res = await donationsApi.registerDonation({ requestId });
        donationId = res.donation.id;
      }
      await donationsApi.upsertScreening(donationId, {
        ...answers,
        additionalNotes: notes.trim() || undefined,
      });
      setSubmitted(true);
      setIneligible(anyRisk);
      if (anyRisk) {
        toast.warning(
          "Screening recorded — you're not eligible to donate right now."
        );
      } else {
        toast.success("Screening cleared — you can now respond.");
      }
    } catch (e) {
      toast.error(
        e instanceof ApiRequestError
          ? e.message
          : "Failed to save screening"
      );
    } finally {
      setSubmitting(false);
    }
  }

  const loading =
    requestQuery.isLoading || profileQuery.isLoading || donationsQuery.isLoading;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/notification/${requestId}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Donation Screening
          </h1>
          <p className="text-sm text-muted-foreground">
            {request
              ? `${bloodGroupLabel} request · ${request.city}`
              : "Answer a few questions before responding"}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !donorProfile || !donorProfile.profileCompleted ? (
        <Card className="border-border/80 shadow-xs">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <ShieldAlert className="h-10 w-10 text-amber-500" />
            <p className="text-sm font-medium">
              Complete your donor onboarding before screening.
            </p>
            <Button asChild>
              <Link href="/onboarding/donor">Go to onboarding</Link>
            </Button>
          </CardContent>
        </Card>
      ) : submitted ? (
        <Card className="border-border/80 shadow-xs">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            {ineligible ? (
              <>
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15 text-amber-600">
                  <TriangleAlert className="h-7 w-7" />
                </span>
                <div>
                  <p className="text-lg font-semibold">
                    Not eligible right now
                  </p>
                  <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                    Based on your answers, you can&apos;t donate at this time.
                    Your screening is recorded — you can respond once
                    you&apos;re eligible.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" asChild>
                    <Link href={`/notification/${requestId}`}>
                      Back to request
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setSubmitted(false)}
                  >
                    Edit answers
                  </Button>
                </div>
              </>
            ) : (
              <>
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                  <ShieldCheck className="h-7 w-7" />
                </span>
                <div>
                  <p className="text-lg font-semibold">Screening complete</p>
                  <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                    You&apos;re eligible to donate. Continue to let the
                    institution know you can help.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" asChild>
                    <Link href={`/notification/${requestId}`}>
                      Back to request
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link href={`/respond/${requestId}`}>
                      Continue to respond
                    </Link>
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardCheck className="h-4 w-4 text-primary" />
              Pre-donation questions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {QUESTIONS.map((q) => (
              <YesNoField
                key={q.key}
                title={q.title}
                description={q.description}
                value={answers[q.key] ?? null}
                yesTone="destructive"
                onChange={(v) =>
                  setAnswers((prev) => ({ ...prev, [q.key]: v }))
                }
              />
            ))}

            <div className="space-y-2 pt-1">
              <Label htmlFor="screening-notes">
                Anything else we should know?{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <textarea
                id="screening-notes"
                className={TEXTAREA_CLASSES}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional details about your health…"
                maxLength={1000}
                rows={3}
              />
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={!allAnswered || submitting}
              onClick={handleSubmit}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit screening
            </Button>
            {!allAnswered && (
              <p className="text-center text-xs font-medium text-amber-600">
                Answer all 5 questions above to submit.
              </p>
            )}
            <p className="text-center text-xs text-muted-foreground">
              Honest answers keep you and the patient safe. Clinical review
              may still defer a donation.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
