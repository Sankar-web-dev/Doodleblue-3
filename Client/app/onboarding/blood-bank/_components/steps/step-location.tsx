"use client";

import { useFormContext } from "react-hook-form";
import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { BloodBankOnboardingFormValues } from "../../_lib/blood-bank-onboarding.schema";
import { StepCard } from "../../../_components/step-card";
import { FormField } from "../../../_components/form-field";
import { InfoBox } from "../../../_components/info-box";

/** Step 3 — Facility address. */
export function StepLocation() {
  const {
    register,
    formState: { errors },
  } = useFormContext<BloodBankOnboardingFormValues>();

  return (
    <StepCard
      icon={MapPin}
      title="Facility Location"
      description="Physical address of the blood bank — donors use this to plan visits."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Street Address / Landmark *"
          htmlFor="addressLine"
          variant="subtle"
          error={errors.addressLine?.message}
          className="sm:col-span-2"
        >
          <Input
            id="addressLine"
            placeholder="e.g. 12, Anna Salai, Near Government Hospital"
            {...register("addressLine")}
          />
        </FormField>

        <FormField
          label="City *"
          htmlFor="city"
          variant="subtle"
          error={errors.city?.message}
        >
          <Input
            id="city"
            placeholder="e.g. Chennai"
            {...register("city")}
          />
        </FormField>

        <FormField
          label="District *"
          htmlFor="district"
          variant="subtle"
          error={errors.district?.message}
        >
          <Input
            id="district"
            placeholder="e.g. Chennai Central"
            {...register("district")}
          />
        </FormField>

        <FormField
          label="State *"
          htmlFor="state"
          variant="subtle"
          error={errors.state?.message}
        >
          <Input
            id="state"
            placeholder="e.g. Tamil Nadu"
            {...register("state")}
          />
        </FormField>

        <FormField
          label="Pincode *"
          htmlFor="pincode"
          variant="subtle"
          error={errors.pincode?.message}
        >
          <Input
            id="pincode"
            placeholder="e.g. 600001"
            {...register("pincode")}
          />
        </FormField>
      </div>

      <InfoBox icon={MapPin} title="Location Matching" tone="muted">
        Donor matching and blood requests use this address to show distance and
        city-level availability. Enter the facility address, not a branch
        office.
      </InfoBox>
    </StepCard>
  );
}
