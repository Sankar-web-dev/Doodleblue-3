"use client";

import { Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";

import type { BloodRequest } from "@/api/requests.api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCancelRequest } from "../_hooks/use-requests";
import { BLOOD_GROUP_LABELS } from "../_lib/request-form";

interface CancelRequestDialogProps {
  request: BloodRequest | null;
  onClose: () => void;
}

/** Confirm soft-delete — cancelled requests stay in history. */
export function CancelRequestDialog({
  request,
  onClose,
}: CancelRequestDialogProps) {
  const cancelMutation = useCancelRequest(onClose);

  const handleConfirm = () => {
    if (!request) return;
    cancelMutation.mutate(request.id, {
      onSuccess: () =>
        toast.success("Request cancelled", {
          description: "The appeal is no longer visible to donors.",
        }),
      onError: (err) =>
        toast.error("Failed to cancel request", {
          description: err instanceof Error ? err.message : "Please try again.",
        }),
    });
  };

  const group = request
    ? BLOOD_GROUP_LABELS[request.bloodGroup] ?? request.bloodGroup
    : "";

  return (
    <Dialog open={!!request} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md border-border/70 bg-card">
        {request && (
          <>
            <DialogHeader>
              <DialogTitle>Cancel this request?</DialogTitle>
              <DialogDescription>
                The {group} appeal for {request.unitsRequired}{" "}
                {request.unitsRequired === 1 ? "unit" : "units"} in{" "}
                {request.city} will be marked cancelled and hidden from donors.
                This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={onClose}>
                Keep request
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirm}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="mr-2 h-4 w-4" />
                )}
                Cancel request
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
