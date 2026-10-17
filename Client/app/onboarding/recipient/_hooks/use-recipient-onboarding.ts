"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuthUser } from "@/lib/use-auth-user";
import {
  profilesApi,
  PROFILES_PERSONAL_KEY,
  PROFILES_RECIPIENT_KEY,
} from "@/api/profiles.api";
import { saveRecipientOnboarding } from "../_actions/recipient-onboarding.actions";
import {
  recipientOnboardingSchema,
  RECIPIENT_ONBOARDING_DEFAULTS,
  type RecipientOnboardingFormValues,
} from "../_lib/recipient-onboarding.schema";
import {
  STEP_VALIDATION_FIELDS,
  STEP_VALIDATION_MESSAGES,
  TOTAL_STEPS,
} from "../_lib/constants";
import {
  mapPersonalProfileToForm,
  mapRecipientProfileToForm,
} from "../_lib/profile-mapper";

const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

export function useRecipientOnboarding() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isPending: authPending } = useAuthUser();

  const [currentStep, setCurrentStep] = useState(1);

  const form = useForm<RecipientOnboardingFormValues>({
    resolver: zodResolver(recipientOnboardingSchema),
    defaultValues: RECIPIENT_ONBOARDING_DEFAULTS,
    mode: "onChange",
  });
  const { setValue, trigger, watch } = form;

  const formValues = watch();

  // Load existing personal & recipient profiles if already started
  const { data: existingPersonal } = useQuery({
    queryKey: PROFILES_PERSONAL_KEY,
    queryFn: () => profilesApi.getPersonalProfile().then((res) => res.profile),
    staleTime: 60_000,
  });

  const { data: existingRecipient } = useQuery({
    queryKey: PROFILES_RECIPIENT_KEY,
    queryFn: () => profilesApi.getRecipientProfile().then((res) => res.profile),
    staleTime: 60_000,
  });

  const applyProfileValues = (
    values: Partial<RecipientOnboardingFormValues>
  ) => {
    (Object.keys(values) as (keyof RecipientOnboardingFormValues)[]).forEach(
      (key) => {
        const value = values[key];
        if (value !== undefined && value !== null) {
          setValue(key, value as RecipientOnboardingFormValues[typeof key]);
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
    if (existingRecipient) {
      applyProfileValues(mapRecipientProfileToForm(existingRecipient));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingRecipient, setValue]);

  const isUpdateMode = Boolean(existingRecipient?.profileCompleted);

  const saveMutation = useMutation({
    mutationFn: () => saveRecipientOnboarding(form.getValues()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILES_PERSONAL_KEY });
      queryClient.invalidateQueries({ queryKey: PROFILES_RECIPIENT_KEY });

      toast.success(
        isUpdateMode ? "Updated successfully!" : "Onboarding Completed!",
        {
          description: isUpdateMode
            ? "Your recipient details have been updated."
            : "Your recipient profile is active. Redirecting to your dashboard...",
        }
      );
      setTimeout(() => {
        router.replace("/dashboard");
      }, 1200);
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
    isUpdateMode,
    saveMutation,
    authPending,
    handleNextStep,
    handlePrevStep,
    goToStep,
  };
}
