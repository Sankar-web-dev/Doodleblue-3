"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AddressMapPicker } from "@/components/location/address-map-picker";
import type { BloodBankOnboardingFormValues } from "../../_lib/blood-bank-onboarding.schema";
import { StepCard } from "../../../_components/step-card";
import { FormField } from "../../../_components/form-field";
import { InfoBox } from "../../../_components/info-box";

/** Step 3 — Facility address. */
export function StepLocation() {
  const {
    register,
    setValue,
    control,
    formState: { errors },
  } = useFormContext<BloodBankOnboardingFormValues>();

  const watchAddressLine = useWatch({ control, name: "addressLine" });
  const watchLatitude = useWatch({ control, name: "latitude" });
  const watchLongitude = useWatch({ control, name: "longitude" });

  return (
    <StepCard
      icon={MapPin}
      title="Facility Location"
      description="Physical address of the blood bank — donors use this to plan visits."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Search Facility Address on Map *
          </label>
          <AddressMapPicker
            id="addressLine"
            placeholder="Search facility name, address, or landmark…"
            value={watchAddressLine ?? ""}
            latitude={watchLatitude}
            longitude={watchLongitude}
            onChangeAddress={(val) =>
              setValue("addressLine", val, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            onLocationSelect={(data) => {
              if (data.addressLine)
                setValue("addressLine", data.addressLine, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              if (data.city)
                setValue("city", data.city, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              if (data.district)
                setValue("district", data.district, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              if (data.state)
                setValue("state", data.state, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              if (data.pincode)
                setValue("pincode", data.pincode, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              setValue("latitude", data.latitude, { shouldDirty: true });
              setValue("longitude", data.longitude, { shouldDirty: true });
            }}
          />
          {errors.addressLine?.message && (
            <p className="text-xs text-destructive">{errors.addressLine.message}</p>
          )}
        </div>

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
