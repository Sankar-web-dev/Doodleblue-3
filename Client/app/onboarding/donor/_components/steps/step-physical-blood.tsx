"use client";

import { useFormContext } from "react-hook-form";
import { AlertTriangle, Droplet, Scale } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { DonorOnboardingFormValues } from "../../_lib/donor-onboarding.schema";
import { StepCard } from "../../../_components/step-card";
import { FormField } from "../../../_components/form-field";
import { IconInput } from "../../../_components/icon-input";
import { YesNoField } from "../../../_components/yes-no-field";
import { BloodGroupPicker } from "../blood-group-picker";

/** Step 2 — Blood Group & Physical Parameters. */
export function StepPhysicalBlood() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<DonorOnboardingFormValues>();
  const bloodGroup = watch("bloodGroup");
  const weightKg = watch("weightKg");
  const donatedBefore = watch("donatedBefore");

  return (
    <StepCard
      icon={Droplet}
      title="Blood Group & Physical Parameters"
      description="Crucial criteria to assess donor volume capacity and whole blood compatibility."
    >
      {/* Blood Group Selector */}
      <FormField label="Select Your Blood Group *" error={errors.bloodGroup?.message}>
        <BloodGroupPicker
          value={bloodGroup}
          onChange={(v) => setValue("bloodGroup", v, { shouldValidate: true })}
        />
      </FormField>

      {/* Height & Weight */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Height (in cm) *"
          htmlFor="heightCm"
          error={errors.heightCm?.message}
        >
          <IconInput
            icon={Scale}
            id="heightCm"
            type="number"
            min={120}
            max={230}
            className="font-medium"
            {...register("heightCm", { valueAsNumber: true })}
          />
        </FormField>

        <FormField
          label={
            <span className="flex items-center justify-between gap-2">
              Weight (in kg) *
              <span className="font-semibold normal-case text-primary">
                Minimum: 50 kg
              </span>
            </span>
          }
          htmlFor="weightKg"
          error={errors.weightKg?.message}
          hint={
            weightKg < 50 && (
              <p className="flex items-center gap-1 text-xs text-destructive">
                <AlertTriangle className="h-3 w-3" /> Donors weighing under 50
                kg are ineligible to prevent fainting and hypovolemia.
              </p>
            )
          }
        >
          <IconInput
            icon={Scale}
            id="weightKg"
            type="number"
            min={30}
            max={200}
            className={`font-medium ${
              weightKg < 50
                ? "border-destructive text-destructive focus-visible:ring-destructive"
                : ""
            }`}
            {...register("weightKg", { valueAsNumber: true })}
          />
        </FormField>
      </div>

      {/* Donation History */}
      <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-4">
        <YesNoField
          title="Have you donated blood before?"
          description="Prior donation history helps track safety intervals."
          value={donatedBefore}
          onChange={(v) => setValue("donatedBefore", v)}
          embedded
        >
          <div className="grid grid-cols-1 gap-4 pt-3 sm:grid-cols-2">
            <FormField
              label="Previous Donation Count"
              htmlFor="previousDonationCount"
              variant="subtle"
            >
              <Input
                id="previousDonationCount"
                type="number"
                min={1}
                max={100}
                {...register("previousDonationCount", { valueAsNumber: true })}
              />
            </FormField>

            <FormField
              label="Date of Last Donation (Must be >90 days ago)"
              htmlFor="lastDonationDate"
              variant="subtle"
            >
              <Input
                id="lastDonationDate"
                type="date"
                {...register("lastDonationDate")}
              />
            </FormField>
          </div>
        </YesNoField>
      </div>
    </StepCard>
  );
}
