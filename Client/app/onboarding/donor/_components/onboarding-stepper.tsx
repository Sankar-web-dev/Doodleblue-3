import { CheckCircle2 } from "lucide-react";
import type { OnboardingStepMeta } from "../_lib/constants";
import { cn } from "@/lib/utils";

interface OnboardingStepperProps {
  steps: OnboardingStepMeta[];
  currentStep: number;
  onStepClick: (step: number) => void;
}

/** Progress bar + clickable step pills (past steps only). */
export function OnboardingStepper({
  steps,
  currentStep,
  onStepClick,
}: OnboardingStepperProps) {
  const totalSteps = steps.length;
  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="rounded-2xl border border-border/70 bg-card/90 p-5 shadow-xs backdrop-blur-md">
      {/* Progress Percent Bar */}
      <div className="mb-4 flex items-center justify-between text-xs font-semibold">
        <span className="text-muted-foreground">
          Step {currentStep} of {totalSteps}:{" "}
          <span className="text-foreground">
            {steps[currentStep - 1].title}
          </span>
        </span>
        <span className="text-primary font-bold">
          {Math.round(progress)}% Completed
        </span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Stepper Dots (Desktop) */}
      <div className="mt-5 hidden grid-cols-6 gap-1.5 sm:grid">
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
                "flex items-center gap-1.5 rounded-lg px-1.5 py-2 text-left transition-colors",
                isCurrent
                  ? "bg-primary/10 text-primary ring-1 ring-primary/40"
                  : isDone
                    ? "text-foreground hover:bg-muted cursor-pointer"
                    : "text-muted-foreground/60 cursor-not-allowed"
              )}
            >
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  isCurrent
                    ? "bg-primary text-primary-foreground"
                    : isDone
                      ? "bg-emerald-500 text-white"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {isDone ? <CheckCircle2 className="h-4 w-4" /> : s.num}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium leading-tight">
                  {s.title}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
