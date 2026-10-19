"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Activity } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DatePicker, todayDateValue } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DonorOnboardingFormValues } from "../../_lib/donor-onboarding.schema";
import { StepCard } from "../../../_components/step-card";
import { YesNoField } from "../../../_components/yes-no-field";

const detailBox = "space-y-2 rounded-lg border border-border/70 bg-muted/30 p-3";
const detailBoxDanger =
  "space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3";
const detailLabel = "text-xs font-semibold text-foreground";

/** Step 3 — Health History & Medical Screening. */
export function StepMedicalScreening() {
  const { register, control, watch, setValue } =
    useFormContext<DonorOnboardingFormValues>();
  const values = watch();

  return (
    <StepCard
      icon={Activity}
      title="Health History & Medical Screening"
      description="Honest reporting protects both your physiological health and vulnerable transfusion recipients."
    >
      {/* 1. Serious Chronic Illness */}
      <YesNoField
        title="Do you have any serious chronic medical conditions?"
        description="E.g., Heart disease, cancer, chronic kidney failure, epilepsy, hepatitis B/C, or bleeding disorders."
        value={values.hasSeriousMedicalCondition}
        onChange={(v) => setValue("hasSeriousMedicalCondition", v)}
        yesTone="destructive"
      >
        <div className={detailBoxDanger}>
          <Label
            htmlFor="medicalConditionDetails"
            className="text-xs font-semibold text-destructive"
          >
            Please specify condition details:
          </Label>
          <Input
            id="medicalConditionDetails"
            placeholder="e.g. Heart murmur, Asthma on inhalers"
            {...register("medicalConditionDetails")}
          />
        </div>
      </YesNoField>

      {/* 2. Diabetes */}
      <YesNoField
        title="Do you have a diagnosis of Diabetes?"
        description="Controlled diabetes without insulin is eligible. Insulin-dependent diabetes is deferred."
        value={values.hasDiabetes}
        onChange={(v) => {
          setValue("hasDiabetes", v);
          if (!v) setValue("diabetesLevel", "NONE");
        }}
      >
        <div className={detailBox}>
          <Label className={detailLabel}>Diabetes Treatment Method:</Label>
          <Controller
            name="diabetesLevel"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select medication type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONTROLLED_DIET">
                    Controlled by Diet &amp; Exercise (Eligible)
                  </SelectItem>
                  <SelectItem value="ORAL_MEDICATION">
                    Controlled with Oral Pills (Metformin etc.) (Eligible)
                  </SelectItem>
                  <SelectItem value="INSULIN">
                    Insulin Injections (Deferred for safety)
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </YesNoField>

      {/* 3. Tattoos or Piercings */}
      <YesNoField
        title="Have you received a tattoo or body piercing recently?"
        description="Tattoos or piercings within the past 6 months require a temporary deferral period."
        value={values.hasTattoo}
        onChange={(v) => setValue("hasTattoo", v)}
      >
        <div className={detailBox}>
          <Label htmlFor="tattooDate" className={detailLabel}>
            Date Tattoo/Piercing was performed:
          </Label>
          <Controller
            name="tattooDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                id="tattooDate"
                value={field.value}
                onChange={field.onChange}
                maxDate={todayDateValue()}
                placeholder="Select date"
              />
            )}
          />
        </div>
      </YesNoField>

      {/* 4. Surgeries */}
      <YesNoField
        title="Have you undergone major or minor surgery?"
        description="Requires at least 6 months recovery time after major procedures."
        value={values.hasHadSurgery}
        onChange={(v) => setValue("hasHadSurgery", v)}
      >
        <div className={detailBox}>
          <Label htmlFor="lastSurgeryDate" className={detailLabel}>
            Date of last surgery:
          </Label>
          <Controller
            name="lastSurgeryDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                id="lastSurgeryDate"
                value={field.value}
                onChange={field.onChange}
                maxDate={todayDateValue()}
                placeholder="Select date"
              />
            )}
          />
        </div>
      </YesNoField>

      {/* 5. Prescription Medications */}
      <YesNoField
        title="Are you currently taking any prescription medications?"
        description="Antibiotics, blood thinners (aspirin/warfarin), or immunosuppressants."
        value={values.takesMedication}
        onChange={(v) => setValue("takesMedication", v)}
      >
        <div className={detailBox}>
          <Label htmlFor="medicationDetails" className={detailLabel}>
            Specify Medication Names:
          </Label>
          <Input
            id="medicationDetails"
            placeholder="e.g. Amoxicillin, Antihypertensives"
            {...register("medicationDetails")}
          />
        </div>
      </YesNoField>
    </StepCard>
  );
}
