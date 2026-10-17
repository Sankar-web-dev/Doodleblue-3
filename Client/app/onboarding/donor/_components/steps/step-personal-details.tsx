"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Calendar, MapPin, Phone, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DonorOnboardingFormValues } from "../../_lib/donor-onboarding.schema";
import { calculateAge } from "../../_lib/eligibility";
import { StepCard } from "../../../_components/step-card";
import { FormField } from "../../../_components/form-field";
import { IconInput } from "../../../_components/icon-input";

/** Step 1 — Personal & Contact Details. */
export function StepPersonalDetails() {
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = useFormContext<DonorOnboardingFormValues>();
  const dateOfBirth = watch("dateOfBirth");

  return (
    <StepCard
      icon={User}
      title="Personal & Contact Details"
      description="Basic demographic and address information needed for blood bank records."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Date of Birth */}
        <FormField
          label="Date of Birth * (Must be 18–65)"
          htmlFor="dateOfBirth"
          error={errors.dateOfBirth?.message}
          hint={
            dateOfBirth && (
              <p className="text-xs text-muted-foreground">
                Calculated Age:{" "}
                <span className="font-semibold text-foreground">
                  {calculateAge(dateOfBirth)} years
                </span>
              </p>
            )
          }
        >
          <IconInput
            icon={Calendar}
            id="dateOfBirth"
            type="date"
            {...register("dateOfBirth")}
          />
        </FormField>

        {/* Gender */}
        <FormField label="Gender *" error={errors.gender?.message}>
          <Controller
            name="gender"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                  <SelectItem value="PREFER_NOT_TO_SAY">
                    Prefer not to say
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </FormField>

        {/* Phone Number */}
        <FormField
          label="Phone Number *"
          htmlFor="phoneNumber"
          error={errors.phoneNumber?.message}
        >
          <IconInput
            icon={Phone}
            id="phoneNumber"
            type="tel"
            placeholder="e.g. 9876543210"
            {...register("phoneNumber")}
          />
        </FormField>

        {/* Marital Status */}
        <FormField label="Marital Status" error={errors.maritalStatus?.message}>
          <Controller
            name="maritalStatus"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select marital status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SINGLE">Single</SelectItem>
                  <SelectItem value="MARRIED">Married</SelectItem>
                  <SelectItem value="DIVORCED">Divorced</SelectItem>
                  <SelectItem value="WIDOWED">Widowed</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
      </div>

      <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
        <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
          <MapPin className="h-4 w-4 text-primary" /> Residential Address &amp;
          Location
        </h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="Street Address / Landmark"
            htmlFor="addressLine"
            variant="subtle"
            className="sm:col-span-2"
          >
            <Input
              id="addressLine"
              placeholder="e.g. Flat 402, Green Meadows, 5th Main Rd"
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

          <FormField label="District" htmlFor="district" variant="subtle">
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
      </div>
    </StepCard>
  );
}
