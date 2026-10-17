"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Building2, FileBadge, Globe, Phone, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BloodBankOnboardingFormValues } from "../../_lib/blood-bank-onboarding.schema";
import { HOSPITAL_TYPES } from "../../_lib/constants";
import { StepCard } from "../../../_components/step-card";
import { FormField } from "../../../_components/form-field";
import { IconInput } from "../../../_components/icon-input";
import { InfoBox } from "../../../_components/info-box";

/** Step 1 — Institution identity, type, phone & licensing. */
export function StepInstitutionDetails() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<BloodBankOnboardingFormValues>();

  return (
    <StepCard
      icon={Building2}
      title="Institution Details"
      description="Legal identity and licensing details of the blood bank or hospital."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Institution Name *"
          htmlFor="institutionName"
          error={errors.institutionName?.message}
          className="sm:col-span-2"
        >
          <IconInput
            icon={Building2}
            id="institutionName"
            placeholder="e.g. CityCare Blood Bank"
            {...register("institutionName")}
          />
        </FormField>

        <FormField
          label="Institution Type *"
          error={errors.hospitalType?.message}
        >
          <Controller
            name="hospitalType"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select institution type" />
                </SelectTrigger>
                <SelectContent>
                  {HOSPITAL_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>

        <FormField
          label="Institution Phone *"
          htmlFor="hospitalPhone"
          error={errors.hospitalPhone?.message}
        >
          <IconInput
            icon={Phone}
            id="hospitalPhone"
            type="tel"
            placeholder="e.g. 04423456789"
            {...register("hospitalPhone")}
          />
        </FormField>

        <FormField
          label="Website"
          htmlFor="website"
          error={errors.website?.message}
        >
          <IconInput
            icon={Globe}
            id="website"
            type="url"
            placeholder="https://www.hospital.org"
            {...register("website")}
          />
        </FormField>

        <FormField
          label="Registration / License Number"
          htmlFor="registrationNumber"
          error={errors.registrationNumber?.message}
        >
          <IconInput
            icon={FileBadge}
            id="registrationNumber"
            placeholder="e.g. BB-TN-2024-00123"
            {...register("registrationNumber")}
          />
        </FormField>
      </div>

      <InfoBox icon={ShieldCheck} title="Verification Required">
        Your registration details are reviewed by an administrator before the
        institution can post blood requirements. Editing details later resets
        verification back to pending.
      </InfoBox>
    </StepCard>
  );
}
