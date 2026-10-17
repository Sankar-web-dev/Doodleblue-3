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
  PROFILES_BLOOD_BANK_KEY,
  type VerificationStatus,
} from "@/api/profiles.api";
import { saveBloodBankOnboarding } from "../_actions/blood-bank-onboarding.actions";
import {
  bloodBankOnboardingSchema,
  BLOOD_BANK_ONBOARDING_DEFAULTS,
  type BloodBankOnboardingFormValues,
} from "../_lib/blood-bank-onboarding.schema";
import {
  STEP_VALIDATION_FIELDS,
  STEP_VALIDATION_MESSAGES,
  TOTAL_STEPS,
} from "../_lib/constants";
import { mapBloodBankProfileToForm } from "../_lib/profile-mapper";

const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

export function useBloodBankOnboarding() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isPending: authPending } = useAuthUser();

  const [currentStep, setCurrentStep] = useState(1);

  const form = useForm<BloodBankOnboardingFormValues>({
    resolver: zodResolver(bloodBankOnboardingSchema),
    defaultValues: BLOOD_BANK_ONBOARDING_DEFAULTS,
    mode: "onChange",
  });
  const { setValue, trigger, watch } = form;

  const formValues = watch();

  // Load existing blood bank profile if already registered
  const { data: existingProfile } = useQuery({
    queryKey: PROFILES_BLOOD_BANK_KEY,
    queryFn: () =>
      profilesApi.getBloodBankProfile().then((res) => res.profile),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!existingProfile) return;
    const values = mapBloodBankProfileToForm(existingProfile);
    (Object.keys(values) as (keyof BloodBankOnboardingFormValues)[]).forEach(
      (key) => {
        const value = values[key];
        if (value !== undefined && value !== null) {
          setValue(key, value as BloodBankOnboardingFormValues[typeof key]);
        }
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingProfile, setValue]);

  const isUpdateMode = Boolean(existingProfile?.institutionName);
  const verificationStatus: VerificationStatus | undefined =
    existingProfile?.verificationStatus;

  const saveMutation = useMutation({
    mutationFn: () => saveBloodBankOnboarding(form.getValues()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILES_BLOOD_BANK_KEY });
      toast.success(
        isUpdateMode ? "Updated successfully!" : "Registration Submitted!",
        {
          description: isUpdateMode
            ? "Your institution details have been updated and sent back for verification."
            : "Your institution profile is submitted for verification. Redirecting to your dashboard...",
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
    verificationStatus,
    saveMutation,
    authPending,
    handleNextStep,
    handlePrevStep,
    goToStep,
  };
}
