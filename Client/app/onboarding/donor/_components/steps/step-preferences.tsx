"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Compass } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DonorOnboardingFormValues } from "../../_lib/donor-onboarding.schema";
import { StepCard } from "../../../_components/step-card";
import { FormField } from "../../../_components/form-field";
import { YesNoField } from "../../../_components/yes-no-field";

/** Step 5 — Availability & Travel Preferences. */
export function StepPreferences() {
  const { register, control, watch, setValue } =
    useFormContext<DonorOnboardingFormValues>();
  const isAvailable = watch("isAvailable");

  return (
    <StepCard
      icon={Compass}
      title="Availability & Travel Preferences"
      description="Configure how and when blood banks and emergency patients can connect with you."
    >
      {/* Active Availability Switch */}
      <YesNoField
        title="Mark as Active & Available for Donation Requests?"
        description="When enabled, nearby hospitals with compatible blood shortages can request your support."
        value={isAvailable}
        onChange={(v) => setValue("isAvailable", v)}
        yesLabel="Available"
        noLabel="Unavailable"
        noTone="destructive"
      />

      {/* Travel Preference */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Travel Preference">
          <Controller
            name="travelPreference"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select travel preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEARBY">Nearby Hospitals Only</SelectItem>
                  <SelectItem value="ANYWHERE">
                    Anywhere in my District / State
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </FormField>

        <FormField
          label="Max Travel Distance (in km)"
          htmlFor="maxTravelDistanceKm"
        >
          <Input
            id="maxTravelDistanceKm"
            type="number"
            min={5}
            max={200}
            {...register("maxTravelDistanceKm", { valueAsNumber: true })}
          />
        </FormField>
      </div>

      {/* Contact Preference */}
      <FormField label="Preferred Communication Channel">
        <Controller
          name="contactPreference"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select contact preference" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PHONE">Phone Call / SMS Only</SelectItem>
                <SelectItem value="EMAIL">
                  Email Notifications Only
                </SelectItem>
                <SelectItem value="BOTH">
                  Both Phone and Email Alerts
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </FormField>
    </StepCard>
  );
}
