"use client";

import { FormProvider } from "react-hook-form";
import { Building2, Loader2 } from "lucide-react";

import { useBloodBankOnboarding } from "../_hooks/use-blood-bank-onboarding";
import { ONBOARDING_STEPS } from "../_lib/constants";
import { OnboardingHeader } from "../../_components/onboarding-header";
import { OnboardingStepper } from "../../_components/onboarding-stepper";
import { StepNavigation } from "../../_components/step-navigation";
import { StepInstitutionDetails } from "./steps/step-institution-details";
import { StepPrimaryContact } from "./steps/step-primary-contact";
import { StepLocation } from "./steps/step-location";
import { StepReviewSubmit } from "./steps/step-review-submit";

/** Orchestrates the 4-step blood bank onboarding wizard. */
export function BloodBankOnboardingWizard() {
  const {
    form,
    currentStep,
    totalSteps,
    isUpdateMode,
    verificationStatus,
    saveMutation,
    authPending,
    handleNextStep,
    handlePrevStep,
    goToStep,
  } = useBloodBankOnboarding();

  if (authPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ambient-mesh">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ambient-mesh px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <OnboardingHeader
          icon={Building2}
          title="Blood Bank Onboarding"
          updateTitle="Update Institution Details"
          badge="Role: Blood Bank"
          updateBadge="Update Mode"
          description="Register your blood bank / hospital to receive and manage blood requests."
          updateDescription="Edit and review your institution profile, contact details, and location."
          isUpdateMode={isUpdateMode}
        />

        <OnboardingStepper
          steps={ONBOARDING_STEPS}
          currentStep={currentStep}
          onStepClick={goToStep}
        />

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(() => {})}>
            {currentStep === 1 && <StepInstitutionDetails />}
            {currentStep === 2 && <StepPrimaryContact />}
            {currentStep === 3 && <StepLocation />}
            {currentStep === 4 && (
              <StepReviewSubmit
                isUpdateMode={isUpdateMode}
                verificationStatus={verificationStatus}
                isSaving={saveMutation.isPending}
                onSave={() => saveMutation.mutate()}
                onEditStep={goToStep}
              />
            )}

            {currentStep < totalSteps && (
              <StepNavigation
                currentStep={currentStep}
                totalSteps={totalSteps}
                isUpdateMode={isUpdateMode}
                reviewLabel="Review & Submit"
                updateReviewLabel="Review & Update"
                onPrev={handlePrevStep}
                onNext={handleNextStep}
              />
            )}
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
