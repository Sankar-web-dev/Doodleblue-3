"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, PauseCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

import type { BloodBankListItem } from "@/api/blood-banks.api";
import type { VerificationStatus } from "@/api/profiles.api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useVerifyBloodBank } from "../_hooks/use-blood-banks";

export interface VerifyTarget {
  bank: BloodBankListItem;
  status: VerificationStatus;
}

const ACTION_META: Record<
  Exclude<VerificationStatus, "PENDING">,
  {
    title: string;
    verb: string;
    icon: typeof CheckCircle2;
    description: string;
    destructive: boolean;
    notesRequired: boolean;
  }
> = {
  VERIFIED: {
    title: "Approve",
    verb: "Approve institution",
    icon: CheckCircle2,
    description:
      "The institution will be marked verified and can post and manage blood requests.",
    destructive: false,
    notesRequired: false,
  },
  REJECTED: {
    title: "Reject",
    verb: "Reject institution",
    icon: XCircle,
    description:
      "The registration will be rejected. The institution can edit details and resubmit.",
    destructive: true,
    notesRequired: true,
  },
  SUSPENDED: {
    title: "Suspend",
    verb: "Suspend institution",
    icon: PauseCircle,
    description:
      "The institution will be suspended and loses access to request workflows until re-approved.",
    destructive: true,
    notesRequired: true,
  },
};

interface VerifyBloodBankDialogProps {
  target: VerifyTarget | null;
  onClose: () => void;
}

export function VerifyBloodBankDialog({
  target,
  onClose,
}: VerifyBloodBankDialogProps) {
  const [notes, setNotes] = useState("");
  const verifyMutation = useVerifyBloodBank(onClose);

  // Reset notes whenever a new target opens (render-time adjust).
  const [prevTarget, setPrevTarget] = useState(target);
  if (target !== prevTarget) {
    setPrevTarget(target);
    if (target) setNotes("");
  }

  const meta = target
    ? ACTION_META[target.status as Exclude<VerificationStatus, "PENDING">]
    : null;

  const handleConfirm = () => {
    if (!target || !meta) return;
    if (meta.notesRequired && !notes.trim()) {
      toast.error("Notes required", {
        description: `Add a reason for ${meta.title.toLowerCase()}ing this institution.`,
      });
      return;
    }
    verifyMutation.mutate(
      {
        id: target.bank.id!,
        input: { status: target.status, notes: notes.trim() || undefined },
      },
      {
        onSuccess: () =>
          toast.success(`${meta.title}d`, {
            description: `${target.bank.institutionName} marked ${target.status.toLowerCase()}.`,
          }),
        onError: (err) =>
          toast.error("Verification failed", {
            description:
              err instanceof Error ? err.message : "Please try again.",
          }),
      }
    );
  };

  return (
    <Dialog open={!!target} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md border-border/70 bg-card">
        {target && meta && (
          <>
            <DialogHeader>
              <DialogTitle>
                {meta.title} &ldquo;{target.bank.institutionName}&rdquo;?
              </DialogTitle>
              <DialogDescription>{meta.description}</DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-2">
              <Label
                htmlFor="verification-notes"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Notes {meta.notesRequired ? "(required)" : "(optional)"}
              </Label>
              <Input
                id="verification-notes"
                placeholder={
                  meta.notesRequired
                    ? "Reason shown to the institution…"
                    : "Optional remarks…"
                }
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant={meta.destructive ? "destructive" : "default"}
                onClick={handleConfirm}
                disabled={verifyMutation.isPending}
              >
                {verifyMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <meta.icon className="mr-2 h-4 w-4" />
                )}
                {meta.verb}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
