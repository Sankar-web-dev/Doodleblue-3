"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Award, Download, Loader2, Printer, ShieldCheck } from "lucide-react";
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
  const certificateRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

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

  const handleDownload = async () => {
    const node = certificateRef.current;
    if (!node) return;
    setDownloading(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `donation-certificate-${donation?.id.slice(0, 8) ?? "download"}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      toast.error("Couldn't generate the certificate image. Try Print instead.");
    } finally {
      setDownloading(false);
    }
  };

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
        <div
          ref={certificateRef}
          className="relative overflow-hidden rounded-2xl border-2 border-amber-500/30 bg-gradient-to-b from-amber-500/5 via-white to-rose-500/5 bg-white p-6 sm:p-8 text-center shadow-lg"
        >
          {/* Subtle watermark badge */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-rose-500/10 blur-2xl" />
          <div className="pointer-events-none absolute -left-12 -bottom-12 h-44 w-44 rounded-full bg-amber-500/10 blur-2xl" />

          {/* Certificate Header */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 shadow-inner">
            <Award className="h-8 w-8" />
          </div>

          <p className="mt-3 text-xs font-bold uppercase tracking-widest text-amber-600">
            Certificate of Appreciation
          </p>
          <h2 className="mt-1 font-display text-2xl font-black tracking-tight text-neutral-900 sm:text-3xl">
            Heroic Blood Donor
          </h2>
          <p className="mt-2 text-xs text-neutral-500">
            This certifies that
          </p>

          <p className="mt-1 font-display text-xl font-bold text-red-600 sm:text-2xl">
            {donorName}
          </p>

          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-neutral-500">
            has generously and selflessly donated{" "}
            <span className="font-bold text-neutral-900">
              {units} {units === 1 ? "unit" : "units"} of {bgLabel} blood
            </span>{" "}
            to support emergency medical treatment.
          </p>

          {/* Recipient context box */}
          <div className="mx-auto mt-5 max-w-md rounded-xl border border-neutral-200 bg-white/80 p-3.5 text-left shadow-2xs">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
              Donated In Support Of
            </p>
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-bold text-neutral-900 truncate">
                  {recipientTarget}
                </p>
                <p className="text-xs text-neutral-500 truncate">
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
          <div className="mx-auto mt-6 flex max-w-md items-center justify-between border-t border-neutral-200 pt-4 text-xs text-neutral-500">
            <div className="text-left">
              <span className="block text-[10px] font-medium uppercase">Date of Donation</span>
              <span className="font-semibold text-neutral-900">{dateStr}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-emerald-600 font-semibold text-xs">
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
          <Button
            variant="outline"
            onClick={handlePrint}
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button
            onClick={handleDownload}
            disabled={downloading}
            className="gap-2"
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download Certificate
          </Button>
        </div>
      </div>
    </AppDialog>
  );
}
