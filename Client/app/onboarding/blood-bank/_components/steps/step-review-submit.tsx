"use client";

import { useFormContext } from "react-hook-form";
import {
  ArrowRight,
  ClipboardCheck,
  Clock,
  Loader2,
  PencilLine,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { VerificationStatus } from "@/api/profiles.api";
import type { BloodBankOnboardingFormValues } from "../../_lib/blood-bank-onboarding.schema";
import {
  CONTACT_DESIGNATIONS,
  HOSPITAL_TYPES,
} from "../../_lib/constants";
import { InfoBox } from "../../../_components/info-box";

interface StepReviewSubmitProps {
  isUpdateMode: boolean;
  verificationStatus?: VerificationStatus;
  isSaving: boolean;
  onSave: () => void;
  onEditStep: (step: number) => void;
}

const label = (
  options: { label: string; value: string }[],
  value: string
) => options.find((o) => o.value === value)?.label ?? value;

function SummaryRow({ k, v }: { k: string; v?: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/50 py-2 last:border-0">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-semibold text-right break-all">
        {v && v.trim() ? v : "—"}
      </span>
    </div>
  );
}

function SummarySection({
  title,
  step,
  onEditStep,
  children,
}: {
  title: string;
  step: number;
  onEditStep: (step: number) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/70 p-4 text-xs">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-bold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 gap-1 text-xs"
          onClick={() => onEditStep(step)}
        >
          <PencilLine className="h-3 w-3" /> Edit
        </Button>
      </div>
      <div>{children}</div>
    </div>
  );
}

/** Step 4 — Review all institution details and submit for verification. */
export function StepReviewSubmit({
  isUpdateMode,
  verificationStatus,
  isSaving,
  onSave,
  onEditStep,
}: StepReviewSubmitProps) {
  const { watch } = useFormContext<BloodBankOnboardingFormValues>();
  const values = watch();

  return (
    <div className="animate-fade-up">
      <Card className="border-primary/30 bg-card shadow-md">
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-8 ring-primary/5">
              <ClipboardCheck className="h-8 w-8" />
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/15 text-primary border-primary/30">
                {isUpdateMode ? "Review Changes" : "Registration Summary"}
              </Badge>
              {verificationStatus && (
                <Badge
                  variant="outline"
                  className={
                    verificationStatus === "VERIFIED"
                      ? "border-emerald-500/40 text-emerald-600"
                      : verificationStatus === "PENDING"
                        ? "border-amber-500/40 text-amber-600"
                        : "border-destructive/40 text-destructive"
                  }
                >
                  {verificationStatus}
                </Badge>
              )}
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Review Institution Profile
            </h2>
            <p className="max-w-xl text-sm text-muted-foreground">
              Confirm the details below. Submitting sends the institution for
              administrator verification — verified blood banks can post and
              manage blood requirements.
            </p>
          </div>

          <div className="space-y-4">
            <SummarySection
              title="Institution"
              step={1}
              onEditStep={onEditStep}
            >
              <SummaryRow k="Name" v={values.institutionName} />
              <SummaryRow
                k="Type"
                v={label(HOSPITAL_TYPES, values.hospitalType)}
              />
              <SummaryRow k="Phone" v={values.hospitalPhone} />
              <SummaryRow k="Website" v={values.website} />
              <SummaryRow
                k="Registration No."
                v={values.registrationNumber}
              />
            </SummarySection>

            <SummarySection
              title="Primary Contact"
              step={2}
              onEditStep={onEditStep}
            >
              <SummaryRow k="Contact Person" v={values.contactPersonName} />
              <SummaryRow
                k="Designation"
                v={label(CONTACT_DESIGNATIONS, values.contactDesignation)}
              />
              <SummaryRow k="Phone" v={values.contactPhone} />
              <SummaryRow k="Email" v={values.officialEmail} />
            </SummarySection>

            <SummarySection
              title="Location"
              step={3}
              onEditStep={onEditStep}
            >
              <SummaryRow k="Address" v={values.addressLine} />
              <SummaryRow
                k="City / District"
                v={`${values.city}, ${values.district}`}
              />
              <SummaryRow
                k="State / Pincode"
                v={`${values.state} — ${values.pincode}`}
              />
            </SummarySection>
          </div>

          <InfoBox icon={Clock} title="What happens next?" tone="muted">
            An administrator reviews the registration number, institution type,
            and contact details. You will be notified once verification is
            approved or if corrections are required.
          </InfoBox>

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
              onClick={onSave}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                  {isUpdateMode ? "Updating..." : "Submitting..."}
                </>
              ) : (
                <>
                  {isUpdateMode
                    ? "Update & Resubmit"
                    : "Submit for Verification"}{" "}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          {isUpdateMode && verificationStatus === "VERIFIED" && (
            <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Note: saving changes resets verification status to pending review.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
