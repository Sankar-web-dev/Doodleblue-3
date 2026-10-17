"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Mail, Phone, User, UserCog } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BloodBankOnboardingFormValues } from "../../_lib/blood-bank-onboarding.schema";
import { CONTACT_DESIGNATIONS } from "../../_lib/constants";
import { StepCard } from "../../../_components/step-card";
import { FormField } from "../../../_components/form-field";
import { IconInput } from "../../../_components/icon-input";
import { InfoBox } from "../../../_components/info-box";

/** Step 2 — Nodal officer / primary contact for the institution. */
export function StepPrimaryContact() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<BloodBankOnboardingFormValues>();

  return (
    <StepCard
      icon={UserCog}
      title="Primary Contact"
      description="Nodal officer who coordinates blood requests and verification calls."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Contact Person Name *"
          htmlFor="contactPersonName"
          error={errors.contactPersonName?.message}
        >
          <IconInput
            icon={User}
            id="contactPersonName"
            placeholder="e.g. Dr. Priya Raman"
            {...register("contactPersonName")}
          />
        </FormField>

        <FormField
          label="Designation *"
          error={errors.contactDesignation?.message}
        >
          <Controller
            name="contactDesignation"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select designation" />
                </SelectTrigger>
                <SelectContent>
                  {CONTACT_DESIGNATIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>

        <FormField
          label="Contact Phone *"
          htmlFor="contactPhone"
          error={errors.contactPhone?.message}
        >
          <IconInput
            icon={Phone}
            id="contactPhone"
            type="tel"
            placeholder="e.g. 9876543210"
            {...register("contactPhone")}
          />
        </FormField>

        <FormField
          label="Official Email"
          htmlFor="officialEmail"
          error={errors.officialEmail?.message}
        >
          <IconInput
            icon={Mail}
            id="officialEmail"
            type="email"
            placeholder="bloodbank@hospital.org"
            {...register("officialEmail")}
          />
        </FormField>
      </div>

      <InfoBox icon={Phone} title="Verification Callbacks" tone="muted">
        Administrators may call this number to verify the institution before
        approving the profile. Keep it reachable during working hours.
      </InfoBox>
    </StepCard>
  );
}
