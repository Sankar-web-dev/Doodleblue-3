"use client";

import Link from "next/link";
import {
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  HeartHandshake,
  Loader2,
  Lock,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type StepState = "done" | "pending" | "locked" | "loading";

interface DonorStepsDialogProps {
  requestId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  onboardingDone: boolean;
  screeningDone: boolean;
  responded: boolean;
}

interface StepRow {
  key: string;
  title: string;
  description: string;
  state: StepState;
  href?: string;
  actionLabel?: string;
}

/** Donor progress checklist — the popup behind "I Want to Help". Shows
 *  tick marks for completed steps and routes to the pending one. */
export function DonorStepsDialog({
  requestId,
  open,
  onOpenChange,
  loading,
  onboardingDone,
  screeningDone,
  responded,
}: DonorStepsDialogProps) {
  const steps: StepRow[] = [
    {
      key: "onboarding",
      title: "Onboarding details",
      description: onboardingDone
        ? "Health screening profile completed"
        : "Finish your donor onboarding first",
      state: loading ? "loading" : onboardingDone ? "done" : "pending",
      href: onboardingDone ? undefined : "/onboarding/donor",
      actionLabel: "Complete",
    },
    {
      key: "screening",
      title: "Donation screening",
      description: screeningDone
        ? "Pre-donation questionnaire submitted"
        : "Answer the donation-day health questions",
      state: loading
        ? "loading"
        : screeningDone
          ? "done"
          : onboardingDone
            ? "pending"
            : "locked",
      href: `/notification/${requestId}/screening`,
      actionLabel: "Fill screening",
    },
    {
      key: "respond",
      title: "Send your response",
      description: responded
        ? "The institution has your response"
        : "Tell the institution you can donate",
      state: loading
        ? "loading"
        : responded
          ? "done"
          : onboardingDone && screeningDone
            ? "pending"
            : "locked",
      href: `/respond/${requestId}`,
      actionLabel: "Respond",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg border-border/70 bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Before you can respond
          </DialogTitle>
          <DialogDescription>
            Complete each step to let the institution know you can donate.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          {steps.map((step, index) => {
            const done = step.state === "done";
            const locked = step.state === "locked";
            const stepLoading = step.state === "loading";
            return (
              <div
                key={step.key}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-3 py-3 transition-colors",
                  done
                    ? "border-emerald-500/25 bg-emerald-500/5"
                    : locked
                      ? "border-border/60 bg-muted/20 opacity-70"
                      : "border-primary/25 bg-primary/5"
                )}
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full",
                    done
                      ? "bg-emerald-500/15 text-emerald-600"
                      : locked
                        ? "bg-muted text-muted-foreground"
                        : "bg-primary/15 text-primary"
                  )}
                >
                  {done ? (
                    <CheckCircle2 className="size-5" />
                  ) : locked ? (
                    <Lock className="size-4" />
                  ) : stepLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : step.key === "respond" ? (
                    <HeartHandshake className="size-4" />
                  ) : (
                    <span className="text-sm font-bold">{index + 1}</span>
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-tight text-foreground">
                    {step.title}
                  </p>
                  <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                    {step.description}
                  </p>
                </div>

                <div className="shrink-0">
                  {!done && !locked && !stepLoading && step.href && (
                    <Button
                      size="sm"
                      variant={step.key === "respond" ? "default" : "outline"}
                      className="h-8 gap-1 whitespace-nowrap text-xs"
                      asChild
                    >
                      <Link href={step.href}>
                        {step.actionLabel}
                        <ChevronRight className="size-3.5" />
                      </Link>
                    </Button>
                  )}
                  {done && (
                    <ShieldCheck className="size-4 text-emerald-600" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
