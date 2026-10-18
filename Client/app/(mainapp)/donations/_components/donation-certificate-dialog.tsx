"use client";

import { Award, Printer, ShieldCheck } from "lucide-react";
import type { Donation } from "@/api/donations.api";
import { AppDialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BLOOD_GROUP_LABELS } from "../../requests/_lib/request-form";

interface DonationCertificateDialogProps {
  donation: Donation | null;
  donorName: string;
  onClose: () => void;
}

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function DonationCertificateDialog({
  donation,
  donorName,
  onClose,
}: DonationCertificateDialogProps) {
  if (!donation) return null;

  const req = donation.request;
  const bgLabel = req?.bloodGroup
    ? BLOOD_GROUP_LABELS[req.bloodGroup] ?? req.bloodGroup
    : "Blood";
  const dateStr = formatDate(donation.donationDate || donation.createdAt);
  const units = donation.unitsDonated || 1;
  const recipientTarget = req?.patientName
    ? `Patient: ${req.patientName}`
    : (req?.hospitalName || "Emergency Blood Requirement");

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppDialog
      open={!!donation}
      onOpenChange={(v) => !v && onClose()}
      size="lg"
      title="Certificate of Life-Saving Donation"
      icon={<Award className="h-5 w-5 text-amber-500" />}
      description="Official acknowledgment of your selfless contribution to saving lives."
    >
      <div className="space-y-5 py-2">
        {/* Certificate Card */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-amber-500/30 bg-gradient-to-b from-amber-500/5 via-background to-rose-500/5 p-6 sm:p-8 text-center shadow-lg">
          {/* Subtle watermark badge */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-rose-500/10 blur-2xl" />
          <div className="pointer-events-none absolute -left-12 -bottom-12 h-44 w-44 rounded-full bg-amber-500/10 blur-2xl" />

          {/* Certificate Header */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 shadow-inner">
            <Award className="h-8 w-8" />
          </div>

          <p className="mt-3 text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
            Certificate of Appreciation
          </p>
          <h2 className="mt-1 font-display text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Heroic Blood Donor
          </h2>
          <p className="mt-2 text-xs text-muted-foreground">
            This certifies that
          </p>

          <p className="mt-1 font-display text-xl font-bold text-primary sm:text-2xl">
            {donorName}
          </p>

          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">
            has generously and selflessly donated{" "}
            <span className="font-bold text-foreground">
              {units} {units === 1 ? "unit" : "units"} of {bgLabel} blood
            </span>{" "}
            to support emergency medical treatment.
          </p>

          {/* Recipient context box */}
          <div className="mx-auto mt-5 max-w-md rounded-xl border border-border/80 bg-background/80 p-3.5 backdrop-blur-xs text-left shadow-2xs">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Donated In Support Of
            </p>
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground truncate">
                  {recipientTarget}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {[req?.hospitalName, req?.city, req?.state]
                    .filter(Boolean)
                    .join(", ") || "Authorized Medical Center"}
                </p>
              </div>
              <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20 shrink-0">
                {bgLabel}
              </Badge>
            </div>
          </div>

          {/* Certificate footer metadata */}
          <div className="mx-auto mt-6 flex max-w-md items-center justify-between border-t border-border/60 pt-4 text-xs text-muted-foreground">
            <div className="text-left">
              <span className="block text-[10px] font-medium uppercase">Date of Donation</span>
              <span className="font-semibold text-foreground">{dateStr}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
              <ShieldCheck className="h-4 w-4" />
              Verified Record
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Print Certificate
          </Button>
        </div>
      </div>
    </AppDialog>
  );
}
