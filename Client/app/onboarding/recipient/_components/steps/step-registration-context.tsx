"use client";

import { useFormContext } from "react-hook-form";
import { HeartHandshake, Info, User, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { RecipientOnboardingFormValues } from "../../_lib/recipient-onboarding.schema";
import { StepCard } from "../../../_components/step-card";
import { FormField } from "../../../_components/form-field";
import { InfoBox } from "../../../_components/info-box";

const REGISTRATION_OPTIONS = [
  {
    value: "SELF" as const,
    icon: User,
    title: "For Myself",
    desc: "I am the patient who may need blood transfusions.",
  },
  {
    value: "SOMEONE_ELSE" as const,
    icon: Users,
    title: "For Someone Else",
    desc: "I am requesting on behalf of a patient (family member, friend, ward).",
  },
];

/** Step 2 — Registration Context: who the blood requests are for. */
export function StepRegistrationContext() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<RecipientOnboardingFormValues>();
  const registrationFor = watch("registrationFor");

  return (
    <StepCard
      icon={HeartHandshake}
      title="Registration Context"
      description="Tell us who this recipient profile represents so requests reach the right patient."
    >
      {/* Who is this for? */}
      <FormField
        label="Who are you registering for? *"
        error={errors.registrationFor?.message}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {REGISTRATION_OPTIONS.map((opt) => {
            const isSelected = registrationFor === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  setValue("registrationFor", opt.value, {
                    shouldValidate: true,
                  })
                }
                className={cn(
                  "flex min-h-[92px] items-start gap-3 rounded-xl border p-4 text-left transition-all",
                  isSelected
                    ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/40 shadow-xs"
                    : "border-border/80 bg-card hover:border-primary/40 hover:bg-muted/40"
                )}
              >
                <opt.icon
                  className={cn(
                    "mt-0.5 h-5 w-5 shrink-0",
                    isSelected ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <div>
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      isSelected ? "text-primary" : "text-foreground"
                    )}
                  >
                    {opt.title}
                  </p>
                  <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                    {opt.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </FormField>

      {/* Relationship — only when registering for someone else */}
      {registrationFor === "SOMEONE_ELSE" && (
        <div className="space-y-2 rounded-lg border border-border/70 bg-muted/30 p-3">
          <Label
            htmlFor="relationshipToPatient"
            className="text-xs font-semibold text-foreground"
          >
            Your relationship to the patient *
          </Label>
          <Input
            id="relationshipToPatient"
            placeholder="e.g. Mother, Spouse, Legal Guardian"
            {...register("relationshipToPatient")}
          />
          {errors.relationshipToPatient?.message && (
            <p className="text-xs text-destructive">
              {errors.relationshipToPatient.message}
            </p>
          )}
        </div>
      )}

      <InfoBox icon={Info} title="Why we ask this:">
        Recipient profiles power blood requests. When registering on behalf of a
        patient, coordinators use your relationship details to verify legitimacy
        before matching donors.
      </InfoBox>
    </StepCard>
  );
}
