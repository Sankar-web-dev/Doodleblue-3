"use client";

import { useFormContext } from "react-hook-form";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  calculateAge,
  type RecipientOnboardingFormValues,
} from "../../_lib/recipient-onboarding.schema";
import { REGISTRATION_FOR_LABELS } from "../../_lib/constants";

interface StepReviewConfirmProps {
  isUpdateMode: boolean;
  isSaving: boolean;
  onSave: () => void;
  onEditStep: (step: number) => void;
}

/** Step 3 — Review entered details and activate the recipient profile. */
export function StepReviewConfirm({
  isUpdateMode,
  isSaving,
  onSave,
  onEditStep,
}: StepReviewConfirmProps) {
  const { watch } = useFormContext<RecipientOnboardingFormValues>();
  const values = watch();
  const age = calculateAge(values.dateOfBirth);

  const rows: { label: string; value: string; step: number }[] = [
    {
      label: "Registering For",
      value:
        REGISTRATION_FOR_LABELS[values.registrationFor] ??
        values.registrationFor,
      step: 2,
    },
    ...(values.registrationFor === "SOMEONE_ELSE"
      ? [
          {
            label: "Relationship to Patient",
            value: values.relationshipToPatient || "—",
            step: 2,
          },
        ]
      : []),
    {
      label: "Age",
      value: values.dateOfBirth ? `${age} yrs` : "—",
      step: 1,
    },
    { label: "Gender", value: values.gender?.replace(/_/g, " ") || "—", step: 1 },
    { label: "Contact", value: values.phoneNumber || "—", step: 1 },
    {
      label: "Location",
      value: [values.city, values.state].filter(Boolean).join(", ") || "—",
      step: 1,
    },
  ];

  return (
    <div className="animate-fade-up">
      <Card className="border-emerald-500/40 bg-card shadow-md">
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 ring-8 ring-emerald-500/5">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
              Ready to Activate
            </Badge>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Review Your Recipient Profile
            </h2>
            <p className="max-w-xl text-sm text-muted-foreground">
              Confirm the details below. Once activated, you can create blood
              requests and get matched with verified donors and blood banks.
            </p>
          </div>

          {/* Summary Review details */}
          <div className="rounded-xl border border-border/70 p-4 text-xs space-y-2">
            {rows.map((row, idx) => (
              <div
                key={row.label}
                className={
                  idx < rows.length - 1
                    ? "flex justify-between border-b border-border/50 pb-2"
                    : "flex justify-between"
                }
              >
                <span className="text-muted-foreground">{row.label}:</span>
                <button
                  type="button"
                  onClick={() => onEditStep(row.step)}
                  className="font-semibold hover:text-primary"
                  title={`Edit step ${row.step}`}
                >
                  {row.value}
                </button>
              </div>
            ))}
          </div>

          {/* Privacy note */}
          <div className="rounded-xl border border-border/70 bg-muted/30 p-4 text-xs text-muted-foreground space-y-1.5">
            <p className="font-semibold text-foreground flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" /> Your data stays
              private
            </p>
            <p>
              • Personal details are shared only with verified blood banks and
              matched donors when you raise a request.
            </p>
            <p>
              • You can revisit this stepper anytime to update your details.
            </p>
          </div>

          {/* Confirmation Button */}
          <div className="pt-2 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onEditStep(1)}
              disabled={isSaving}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Edit Details
            </Button>
            <Button
              type="button"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 h-11"
              disabled={isSaving}
              onClick={onSave}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                  {isUpdateMode
                    ? "Updating Recipient Profile..."
                    : "Saving Recipient Profile..."}
                </>
              ) : (
                <>
                  {isUpdateMode
                    ? "Update Recipient Profile"
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
