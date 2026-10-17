"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuthUser } from "@/lib/use-auth-user";
import {
  profilesApi,
  PROFILES_DONOR_KEY,
  PROFILES_PERSONAL_KEY,
} from "@/api/profiles.api";
import { saveDonorOnboarding } from "../_actions/donor-onboarding.actions";
import {
  donorOnboardingSchema,
  DONOR_ONBOARDING_DEFAULTS,
  type DonorOnboardingFormValues,
} from "../_lib/donor-onboarding.schema";
import { evaluateEligibility } from "../_lib/eligibility";
import {
  STEP_VALIDATION_FIELDS,
  STEP_VALIDATION_MESSAGES,
  TOTAL_STEPS,
} from "../_lib/constants";
import {
  mapDonorProfileToForm,
  mapPersonalProfileToForm,
} from "../_lib/profile-mapper";

const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

export function useDonorOnboarding() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isPending: authPending } = useAuthUser();

  const [currentStep, setCurrentStep] = useState(1);

  const form = useForm<DonorOnboardingFormValues>({
    resolver: zodResolver(donorOnboardingSchema),
    defaultValues: DONOR_ONBOARDING_DEFAULTS,
    mode: "onChange",
  });
  const { setValue, trigger, watch } = form;

  const formValues = watch();

  // Load existing personal & donor profiles if already started
  const { data: existingPersonal } = useQuery({
    queryKey: PROFILES_PERSONAL_KEY,
    queryFn: () => profilesApi.getPersonalProfile().then((res) => res.profile),
    staleTime: 60_000,
  });

  const { data: existingDonor } = useQuery({
    queryKey: PROFILES_DONOR_KEY,
    queryFn: () => profilesApi.getDonorProfile().then((res) => res.profile),
    staleTime: 60_000,
  });

  const applyProfileValues = (
    values: Partial<DonorOnboardingFormValues>
  ) => {
    (Object.keys(values) as (keyof DonorOnboardingFormValues)[]).forEach(
      (key) => {
        const value = values[key];
        if (value !== undefined && value !== null) {
          setValue(key, value as DonorOnboardingFormValues[typeof key]);
        }
      }
    );
  };

  useEffect(() => {
    if (existingPersonal) {
      applyProfileValues(mapPersonalProfileToForm(existingPersonal));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingPersonal, setValue]);

  useEffect(() => {
    if (existingDonor) {
      applyProfileValues(mapDonorProfileToForm(existingDonor));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingDonor, setValue]);

  const isUpdateMode = Boolean(
    existingDonor?.profileCompleted || existingDonor?.bloodGroup
  );

  // Eligibility evaluation calculation
  const evaluation = useMemo(
    () => evaluateEligibility(formValues),
    [formValues]
  );

  const saveMutation = useMutation({
    mutationFn: (isEligible: boolean) =>
      saveDonorOnboarding(form.getValues(), isEligible),
    onSuccess: (_, isEligible) => {
      queryClient.invalidateQueries({ queryKey: PROFILES_PERSONAL_KEY });
      queryClient.invalidateQueries({ queryKey: PROFILES_DONOR_KEY });

      if (isEligible) {
        toast.success(
          isUpdateMode ? "Updated successfully!" : "Onboarding Completed!",
          {
            description: isUpdateMode
              ? "Your donor health information has been updated."
              : "Your donor profile is active and verified. Redirecting to your dashboard...",
          }
        );
        setTimeout(() => {
          router.replace("/dashboard");
        }, 1200);
      } else {
        toast.info(
          isUpdateMode ? "Updated successfully!" : "Profile Saved as Deferred",
          {
            description: isUpdateMode
              ? "Your donor profile has been updated in deferred status."
              : "We've recorded your profile. You can re-verify once eligibility criteria are satisfied.",
          }
        );
        router.replace("/dashboard");
      }
    },
    onError: (err: unknown) => {
      toast.error("Failed to save profile", {
        description:
          err instanceof Error
            ? err.message
            : "Please check your network and try again.",
      });
    },
  });

  const handleNextStep = async () => {
    const fields = STEP_VALIDATION_FIELDS[currentStep];
    if (fields) {
      const isValid = await trigger(fields);
      if (!isValid) {
        const message = STEP_VALIDATION_MESSAGES[currentStep];
        toast.error(message.title, { description: message.description });
        return;
      }
    }

    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1);
      scrollTop();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      scrollTop();
    }
  };

  const goToStep = (stepNumber: number) => {
    setCurrentStep(stepNumber);
    scrollTop();
  };

  return {
    form,
    formValues,
    currentStep,
    totalSteps: TOTAL_STEPS,
    evaluation,
    isUpdateMode,
    saveMutation,
    authPending,
    handleNextStep,
    handlePrevStep,
    goToStep,
  };
}
