"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ClipboardCheck,
  HeartPulse,
  Loader2,
  RefreshCcw,
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
  const queryClient = useQueryClient();

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
      const res = await donationsApi.upsertScreening(donationId, {
        ...answers,
        additionalNotes: notes.trim() || undefined,
      });
      // Push the saved screening into the cache so the respond page sees it
      // immediately — otherwise the 30s staleTime keeps showing the gate.
      queryClient.setQueryData(
        ["donations", donationId, "screening"],
        res
      );
      // The donations list may not contain the just-registered donation yet.
      await queryClient.invalidateQueries({ queryKey: MY_DONATIONS_KEY });
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
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
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

      <div className="grid gap-10 md:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
      {loading ? (
        <div className="flex h-full min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !donorProfile || !donorProfile.profileCompleted ? (
        <Card className="h-full border-border/80 shadow-xs">
          <CardContent className="flex h-full flex-col items-center justify-center gap-3 py-10 text-center">
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
        <Card className="h-full border-border/80 shadow-xs">
          <CardContent className="flex h-full flex-col items-center justify-center gap-4 py-10 text-center">
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
                  <p className="text-xl font-semibold">Screening complete</p>
                  <p className="mx-auto mt-1 max-w-sm text-base text-muted-foreground">
                    You&apos;re eligible to donate. Continue to let the
                    institution know you can help.
                  </p>
                </div>

                <div className="w-full max-w-md rounded-xl border border-border/70 bg-muted/30 p-5 text-left">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    What happens next
                  </p>
                  <ul className="mt-2.5 space-y-2.5 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      Your screening answers are saved to this donation
                      request.
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      Send your response — the institution will contact you to
                      coordinate the donation.
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      Once your donation is confirmed, your Life-Saving
                      Certificate appears in My Donations.
                    </li>
                  </ul>
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
        <Card className="h-full border-border/80 shadow-xs">
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

        {/* Illustration + why-it-matters card */}
        <aside className="hidden md:block">
          <Card className="flex h-full flex-col overflow-hidden border-border/80 shadow-xs">
            <div className="flex max-h-72 flex-1 items-center justify-center bg-gradient-to-b from-rose-500/10 via-card to-card p-6">
              <Image
                src="/donate-b.svg"
                alt="Illustration of a blood donation"
                width={500}
                height={500}
                priority
                className="max-h-full w-auto max-w-full object-contain"
              />
            </div>
            <CardContent className="space-y-4 p-6 pt-2">
              <h2 className="font-display text-lg font-bold tracking-tight">
                Why this screening matters
              </h2>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-semibold text-[16px]">Keeps you safe</p>
                    <p className="text-[15px] leading-relaxed text-muted-foreground">
                      A quick check that donating is safe for your own health.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600">
                    <HeartPulse className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-semibold text-[16px]">Protects the patient</p>
                    <p className="text-[15px] leading-relaxed text-muted-foreground">
                      Ensures every unit given is safe for the person who
                      receives it.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                    <Clock className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-semibold text-[16px]">Takes under a minute</p>
                    <p className="text-[15px] leading-relaxed text-muted-foreground">
                      Five yes-or-no questions — then you&apos;re ready to
                      respond.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <RefreshCcw className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-semibold text-[16px]">Checked every visit</p>
                    <p className="text-[15px] leading-relaxed text-muted-foreground">
                      Screening is repeated before each donation — even if
                      you&apos;ve donated before.
                    </p>
                  </div>
                </li>
              </ul>
            
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
