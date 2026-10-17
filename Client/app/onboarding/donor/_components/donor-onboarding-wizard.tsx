"use client";

import { FormProvider } from "react-hook-form";
import { Droplet, Loader2 } from "lucide-react";

import { useDonorOnboarding } from "../_hooks/use-donor-onboarding";
import { ONBOARDING_STEPS } from "../_lib/constants";
import { OnboardingHeader } from "../../_components/onboarding-header";
import { OnboardingStepper } from "../../_components/onboarding-stepper";
import { StepNavigation } from "../../_components/step-navigation";
import { StepPersonalDetails } from "./steps/step-personal-details";
import { StepPhysicalBlood } from "./steps/step-physical-blood";
import { StepMedicalScreening } from "./steps/step-medical-screening";
import { StepGenderScreening } from "./steps/step-gender-screening";
import { StepPreferences } from "./steps/step-preferences";
import { StepHealthAssessment } from "./steps/step-health-assessment";

/** Orchestrates the 6-step donor onboarding wizard. */
export function DonorOnboardingWizard() {
  const {
    form,
    currentStep,
    totalSteps,
    evaluation,
    isUpdateMode,
    saveMutation,
    authPending,
    handleNextStep,
    handlePrevStep,
    goToStep,
  } = useDonorOnboarding();

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
          icon={Droplet}
          title="Blood Donor Onboarding"
          updateTitle="Update Donor Health Details"
          badge="Role: Blood Donar"
          updateBadge="Update Health Mode"
          description="Complete your clinical screening to activate donor status & save lives."
          updateDescription="Edit and review your clinical screening parameters, availability, and preferences."
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
            {currentStep === 2 && <StepPhysicalBlood />}
            {currentStep === 3 && <StepMedicalScreening />}
            {currentStep === 4 && <StepGenderScreening />}
            {currentStep === 5 && <StepPreferences />}
            {currentStep === 6 && (
              <StepHealthAssessment
                evaluation={evaluation}
                isUpdateMode={isUpdateMode}
                isSaving={saveMutation.isPending}
                onSave={(eligible) => saveMutation.mutate(eligible)}
                onEditStep={goToStep}
              />
            )}

            {currentStep < totalSteps && (
              <StepNavigation
                currentStep={currentStep}
                totalSteps={totalSteps}
                isUpdateMode={isUpdateMode}
                reviewLabel="Evaluate Health & Screen"
                updateReviewLabel="Review & Update Health"
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
