import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OnboardingStepMeta } from "../_lib/constants";

interface OnboardingStepperProps {
  steps: OnboardingStepMeta[];
  currentStep: number;
  onStepClick: (step: number) => void;
}

/** Progress bar + clickable dots for completed steps. */
export function OnboardingStepper({
  steps,
  currentStep,
  onStepClick,
}: OnboardingStepperProps) {
  const totalSteps = steps.length;
  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;
  const active = steps.find((s) => s.num === currentStep);

  return (
    <div className="rounded-2xl border border-border/80 bg-card/90 p-5 shadow-sm backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between text-xs">
        <span className="font-semibold text-foreground">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="text-muted-foreground">
          {active?.title} — {active?.desc}
        </span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Stepper Dots (Desktop) — column count follows the step list */}
      <div
        className="mt-5 hidden gap-1.5 sm:grid"
        style={{ gridTemplateColumns: `repeat(${totalSteps}, minmax(0, 1fr))` }}
      >
        {steps.map((s) => {
          const isDone = currentStep > s.num;
          const isCurrent = currentStep === s.num;
          return (
            <button
              key={s.num}
              type="button"
              onClick={() => s.num < currentStep && onStepClick(s.num)}
              disabled={s.num > currentStep}
              className={cn(
                "group flex flex-col items-center gap-1.5 rounded-lg px-2 py-2 text-center transition-colors",
                s.num < currentStep && "cursor-pointer hover:bg-muted/60",
                s.num > currentStep && "cursor-not-allowed opacity-50"
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold transition-all",
                  isDone &&
                    "border-primary bg-primary text-primary-foreground",
                  isCurrent &&
                    "border-primary bg-primary/15 text-primary ring-2 ring-primary/30",
                  !isDone &&
                    !isCurrent &&
                    "border-border bg-muted text-muted-foreground"
                )}
              >
                {isDone ? <Check className="h-4 w-4" /> : s.num}
              </span>
              <span
                className={cn(
                  "text-[10px] font-semibold leading-tight",
                  isCurrent ? "text-primary" : "text-muted-foreground"
                )}
              >
                {s.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
