"use client";

import { Controller, useFormContext } from "react-hook-form";
import { CheckCircle2, Heart, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DatePicker, todayDateValue } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import type { DonorOnboardingFormValues } from "../../_lib/donor-onboarding.schema";
import { StepCard } from "../../../_components/step-card";
import { YesNoField } from "../../../_components/yes-no-field";
import { InfoBox } from "../../../_components/info-box";

const WELLNESS_ITEMS = [
  "I am feeling fit, healthy, and free from fever or active viral infections today.",
  "I agree not to consume alcohol for at least 24 hours prior to blood donation.",
  "I have had adequate sleep and intend to drink plenty of fluids prior to donation.",
];

/** Step 4 — Gender Screening & Clinical Safety. */
export function StepGenderScreening() {
  const { register, control, watch, setValue } =
    useFormContext<DonorOnboardingFormValues>();
  const gender = watch("gender");
  const currentlyPregnant = watch("currentlyPregnant");
  const recentPregnancyOrDelivery = watch("recentPregnancyOrDelivery");

  return (
    <StepCard
      icon={Heart}
      title="Gender Screening & Clinical Safety"
      description="Tailored screening questions corresponding to physiological criteria in the clinical schema."
    >
      {gender === "FEMALE" ? (
        <div className="space-y-4">
          <InfoBox icon={Info} title="Maternal Health Protocol:">
            Indian National Blood Transfusion Council regulations require
            temporary deferral during pregnancy and lactation to prevent
            postpartum iron depletion.
          </InfoBox>

          <YesNoField
            title="Are you currently pregnant?"
            description="Donation during pregnancy is deferred to safeguard maternal & fetal health."
            value={currentlyPregnant}
            onChange={(v) => setValue("currentlyPregnant", v)}
            yesTone="destructive"
          />

          <YesNoField
            title="Have you had a delivery or miscarriage within the last 6 months?"
            description="Or are you currently breastfeeding a child under 6 months old?"
            value={recentPregnancyOrDelivery}
            onChange={(v) => setValue("recentPregnancyOrDelivery", v)}
          >
            <div className="space-y-2 rounded-lg border border-border/70 bg-muted/30 p-3">
              <Label
                htmlFor="lastPregnancyDate"
                className="text-xs font-semibold text-foreground"
              >
                Date of delivery or miscarriage:
              </Label>
              <Controller
                name="lastPregnancyDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    id="lastPregnancyDate"
                    value={field.value}
                    onChange={field.onChange}
                    maxDate={todayDateValue()}
                    placeholder="Select date"
                  />
                )}
              />
            </div>
          </YesNoField>
        </div>
      ) : (
        <div className="space-y-4">
          <InfoBox icon={CheckCircle2} tone="emerald" className="p-5">
            <p className="text-sm font-bold text-foreground">
              Standard Screening Protocol Active
            </p>
            <p className="mt-1">
              Gender recorded:{" "}
              <span className="font-semibold text-foreground">{gender}</span>.
              Maternal deferral rules do not apply.
            </p>
          </InfoBox>

          {/* General Wellness Confirmation */}
          <div className="rounded-xl border border-border/80 p-4 space-y-3">
            <h4 className="text-sm font-semibold text-foreground">
              Pre-Donation Wellness Checklist
            </h4>
            <div className="space-y-2 text-xs text-muted-foreground">
              {WELLNESS_ITEMS.map((item) => (
                <label
                  key={item}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-border"
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </StepCard>
  );
}
