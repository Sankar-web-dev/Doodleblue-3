"use client";

import { Loader2, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RequestPoster } from "./request-poster";
import type { RequestPosterData } from "../_lib/request-form";

interface RequestPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  data: RequestPosterData | null;
  /** Dialog header text — defaults to the bank-side preview copy. */
  title?: string;
  description?: string;
  /** When provided, shows a confirm button (form preview step). */
  confirmLabel?: string;
  onConfirm?: () => void;
  confirmPending?: boolean;
}

/**
 * Poster preview dialog — used both as the "Preview" step inside the
 * request form and as the read-only poster view from the requests list.
 */
export function RequestPreviewDialog({
  open,
  onClose,
  data,
  title = "Request Preview",
  description = "This is how the blood appeal will appear to donors.",
  confirmLabel,
  onConfirm,
  confirmPending,
}: RequestPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border/70 bg-background p-4 sm:max-w-2xl sm:p-6">
        <DialogHeader className="pb-1">
          <DialogTitle className="text-base">{title}</DialogTitle>
          <DialogDescription className="text-xs">
            {description}
          </DialogDescription>
        </DialogHeader>

        {data && <RequestPoster data={data} />}

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={confirmPending}>
            {onConfirm ? "Back to Edit" : "Close"}
          </Button>
          {onConfirm && (
            <Button
              onClick={onConfirm}
              disabled={confirmPending}
              className="gap-2"
            >
              {confirmPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Megaphone className="h-4 w-4" />
              )}
              {confirmLabel ?? "Publish Request"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
