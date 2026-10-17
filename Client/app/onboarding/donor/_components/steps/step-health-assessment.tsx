"use client";

import { useFormContext } from "react-hook-form";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Info,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { DonorOnboardingFormValues } from "../../_lib/donor-onboarding.schema";
import type { EligibilityEvaluation } from "../../_lib/eligibility";
import { BLOOD_GROUP_LABELS } from "../../_lib/constants";

interface StepHealthAssessmentProps {
  evaluation: EligibilityEvaluation;
  isUpdateMode: boolean;
  isSaving: boolean;
  onSave: (isEligible: boolean) => void;
  onEditStep: (step: number) => void;
}

/** Step 6 — Eligibility result: success screen or deferral breakdown. */
export function StepHealthAssessment({
  evaluation,
  isUpdateMode,
  isSaving,
  onSave,
  onEditStep,
}: StepHealthAssessmentProps) {
  const { watch } = useFormContext<DonorOnboardingFormValues>();
  const values = watch();

  if (evaluation.isEligible) {
    return (
      <div className="animate-fade-up">
        <Card className="border-emerald-500/40 bg-card shadow-md">
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 ring-8 ring-emerald-500/5">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
                Clinical Screening Passed
              </Badge>
              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                You Are Fully Eligible to Donate Blood!
              </h2>
              <p className="max-w-xl text-sm text-muted-foreground">
                Your health assessment meets Indian Red Cross &amp; WHO blood
                donation standards. Your profile is ready to join the
                life-saving donor registry.
              </p>
            </div>

            {/* Donor Quick Card Preview */}
            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border/80 bg-muted/30 p-5 sm:grid-cols-4">
              <div className="text-center">
                <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                  Blood Type
                </p>
                <p className="mt-1 font-display text-2xl font-black text-primary">
                  {BLOOD_GROUP_LABELS[values.bloodGroup] ?? values.bloodGroup}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                  Weight / BMI
                </p>
                <p className="mt-1 font-display text-xl font-bold text-foreground">
                  {values.weightKg} kg{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    ({evaluation.bmi} BMI)
                  </span>
                </p>
              </div>
              <div className="text-center">
                <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                  Age
                </p>
                <p className="mt-1 font-display text-xl font-bold text-foreground">
                  {evaluation.age} yrs
                </p>
              </div>
              <div className="text-center">
                <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                  Status
                </p>
                <p className="mt-1 font-display text-base font-bold text-emerald-600 dark:text-emerald-400">
                  Ready &amp; Active
                </p>
              </div>
            </div>

            {/* Summary Review details */}
            <div className="rounded-xl border border-border/70 p-4 text-xs space-y-2">
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Location:</span>
                <span className="font-semibold">
                  {values.city}, {values.state}
                </span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Contact:</span>
                <span className="font-semibold">{values.phoneNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Max Travel Range:
                </span>
                <span className="font-semibold">
                  {values.maxTravelDistanceKm} km ({values.travelPreference})
                </span>
              </div>
            </div>

            {/* Confirmation Button */}
            <div className="pt-2 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onEditStep(1)}
                disabled={isSaving}
              >
                Edit Details
              </Button>
              <Button
                type="button"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 h-11"
                disabled={isSaving}
                onClick={() => onSave(true)}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                    {isUpdateMode
                      ? "Updating Health Profile..."
                      : "Saving Donor Profile..."}
                  </>
                ) : (
                  <>
                    {isUpdateMode
                      ? "Update Health Profile"
                      : "Complete Onboarding & Go to Dashboard"}{" "}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <Card className="border-destructive/40 bg-card shadow-md">
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive ring-8 ring-destructive/5">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <Badge variant="destructive" className="font-semibold">
              Health Deferral Notice
            </Badge>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              You Are Currently Not Eligible to Donate Blood
            </h2>
            <p className="max-w-xl text-sm text-muted-foreground">
              We deeply appreciate your compassion and willingness to donate
              blood. However, based on safety regulations, you cannot donate at
              this time for the reasons outlined below:
            </p>
          </div>

          {/* Specific Reasons List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Specific Health Assessment Findings ({evaluation.reasons.length}):
            </h3>
            <div className="divide-y divide-border/60 rounded-xl border border-destructive/20 bg-destructive/5">
              {evaluation.reasons.map((r, idx) => (
                <div key={idx} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                      <div>
                        <p className="text-sm font-bold text-foreground">
                          {r.title}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                          {r.description}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-border shrink-0"
                      onClick={() => onEditStep(r.stepToEdit)}
                    >
                      Edit Step {r.stepToEdit}
                    </Button>
                  </div>

                  {r.eligibleAfter && (
                    <div className="ml-7 flex items-center gap-2 text-xs font-semibold text-primary">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Estimated Date Eligible: {r.eligibleAfter}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Informative Guidance */}
          <div className="rounded-xl border border-border/70 bg-muted/30 p-4 text-xs text-muted-foreground space-y-1.5">
            <p className="font-semibold text-foreground flex items-center gap-1.5">
              <Info className="h-4 w-4 text-primary" /> What happens next?
            </p>
            <p>
              • If any answer was a typo (e.g. wrong year or weight), click{" "}
              <strong>Back to Review Details</strong> to adjust your entry.
            </p>
            <p>
              • If this is a temporary deferral (e.g. tattoo or weight
              recovery), your profile will be saved in non-active status, and
              you can re-apply once the duration passes.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between pt-2">
            <Button
              type="button"
              variant="default"
              className="h-11 px-6 font-semibold"
              onClick={() =>
                onEditStep(evaluation.reasons[0]?.stepToEdit || 1)
              }
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Review Details
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-11 px-6"
              disabled={isSaving}
              onClick={() => onSave(false)}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                  {isUpdateMode ? "Updating..." : "Saving..."}
                </>
              ) : isUpdateMode ? (
                "Update Profile as Deferred"
              ) : (
                "Save Profile as Deferred & Go to Dashboard"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
