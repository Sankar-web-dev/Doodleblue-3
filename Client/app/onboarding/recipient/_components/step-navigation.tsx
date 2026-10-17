import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  isUpdateMode: boolean;
  onPrev: () => void;
  onNext: () => void;
}

/** Sticky-style Previous / Next footer shown on all steps before the final one. */
export function StepNavigation({
  currentStep,
  totalSteps,
  isUpdateMode,
  onPrev,
  onNext,
}: StepNavigationProps) {
  return (
    <div className="mt-6 flex items-center justify-between rounded-xl border border-border/70 bg-card/90 p-4 backdrop-blur-md">
      <Button
        type="button"
        variant="outline"
        onClick={onPrev}
        disabled={currentStep === 1}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" /> Previous
      </Button>

      <div className="text-xs text-muted-foreground hidden sm:block">
        All details stored securely adhering to medical privacy guidelines.
      </div>

      <Button
        type="button"
        onClick={onNext}
        className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6"
      >
        {currentStep === totalSteps - 1
          ? isUpdateMode
            ? "Review Changes"
            : "Review & Confirm"
          : "Next Step"}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
