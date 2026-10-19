"use client";

import { FormProvider } from "react-hook-form";
import { HeartHandshake, Loader2 } from "lucide-react";

import { useRecipientOnboarding } from "../_hooks/use-recipient-onboarding";
import { ONBOARDING_STEPS } from "../_lib/constants";
import { OnboardingHeader } from "../../_components/onboarding-header";
import { OnboardingStepper } from "../../_components/onboarding-stepper";
import { StepNavigation } from "../../_components/step-navigation";
import { StepPersonalDetails } from "./steps/step-personal-details";
import { StepRegistrationContext } from "./steps/step-registration-context";
import { StepReviewConfirm } from "./steps/step-review-confirm";

/** Orchestrates the 3-step recipient onboarding wizard. */
export function RecipientOnboardingWizard() {
  const {
    form,
    currentStep,
    totalSteps,
    isUpdateMode,
    saveMutation,
    authPending,
    handleNextStep,
    handlePrevStep,
    goToStep,
  } = useRecipientOnboarding();

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
          icon={HeartHandshake}
          title="Blood Recipient Onboarding"
          updateTitle="Update Recipient Details"
          badge="Role: Blood Recipient"
          updateBadge="Update Mode"
          description="Complete your registration to create blood requests & get matched with donors."
          updateDescription="Edit and review your registration context and contact details."
          isUpdateMode={isUpdateMode}
        />

        <OnboardingStepper
          steps={ONBOARDING_STEPS}
          currentStep={currentStep}
          onStepClick={goToStep}
        />

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(() => {})}>
            {currentStep === 1 && <StepPersonalDetails />}
            {currentStep === 2 && <StepRegistrationContext />}
            {currentStep === 3 && (
              <StepReviewConfirm
                isUpdateMode={isUpdateMode}
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
                reviewLabel="Review & Confirm"
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
