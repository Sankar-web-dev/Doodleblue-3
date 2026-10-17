"use client";

import {
  Building2,
  CheckCircle2,
  Globe,
  Mail,
  MapPin,
  PauseCircle,
  Phone,
  UserCog,
  XCircle,
} from "lucide-react";

import type { BloodBankListItem } from "@/api/blood-banks.api";
import type { VerificationStatus } from "@/api/profiles.api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import type { VerifyTarget } from "./verify-blood-bank-dialog";

const STATUS_STYLES: Record<VerificationStatus, string> = {
  PENDING: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  VERIFIED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  REJECTED: "bg-destructive/10 text-destructive border-destructive/20",
  SUSPENDED: "bg-muted text-muted-foreground border-border/40",
};

const HOSPITAL_TYPE_LABELS: Record<string, string> = {
  GOVERNMENT: "Government",
  PRIVATE: "Private",
  TRUST: "Trust / Charitable",
  OTHER: "Other",
};

const DESIGNATION_LABELS: Record<string, string> = {
  ADMIN: "Administrator",
  DOCTOR: "Doctor",
  BLOOD_BANK_OFFICER: "Blood Bank Officer",
  OTHER: "Other",
};

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <dt className="text-muted-foreground shrink-0">{label}</dt>
      <dd className="text-right break-all font-medium">
        {value && value.trim() ? value : "—"}
      </dd>
    </div>
  );
}

interface BloodBankDetailsSheetProps {
  bank: BloodBankListItem | null;
  canVerify: boolean;
  onClose: () => void;
  onVerify: (target: VerifyTarget) => void;
}

export function BloodBankDetailsSheet({
  bank,
  canVerify,
  onClose,
  onVerify,
}: BloodBankDetailsSheetProps) {
  const status = bank?.verificationStatus ?? "PENDING";

  return (
    <Sheet open={!!bank} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        {bank && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <SheetTitle>{bank.institutionName}</SheetTitle>
                  <SheetDescription>
                    {HOSPITAL_TYPE_LABELS[bank.hospitalType ?? "OTHER"]}
                    {bank.registrationNumber
                      ? ` · Reg. ${bank.registrationNumber}`
                      : ""}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="mt-4 flex items-center gap-2">
              <Badge className={`${STATUS_STYLES[status]} text-xs`}>
                {status}
              </Badge>
              {bank.verifiedAt && (
                <span className="text-xs text-muted-foreground">
                  Verified{" "}
                  {new Date(bank.verifiedAt).toLocaleDateString()}
                  {bank.verifiedBy?.name ? ` by ${bank.verifiedBy.name}` : ""}
                </span>
              )}
            </div>

            {bank.verificationNotes && (
              <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">
                  Verification notes
                </p>
                {bank.verificationNotes}
              </div>
            )}

            <Separator className="my-5" />

            <div className="space-y-3">
              <h4 className="flex items-center gap-2 text-sm font-semibold">
                <Building2 className="h-4 w-4 text-primary" /> Institution
              </h4>
              <dl className="space-y-2">
                <DetailRow label="Phone" value={bank.hospitalPhone} />
                <DetailRow label="Website" value={bank.website} />
                <DetailRow
                  label="Registration No."
                  value={bank.registrationNumber}
                />
                <DetailRow
                  label="Account"
                  value={
                    bank.user
                      ? `${bank.user.name} (${bank.user.email})`
                      : undefined
                  }
                />
              </dl>
            </div>

            <Separator className="my-5" />

            <div className="space-y-3">
              <h4 className="flex items-center gap-2 text-sm font-semibold">
                <UserCog className="h-4 w-4 text-primary" /> Primary Contact
              </h4>
              <dl className="space-y-2">
                <DetailRow label="Name" value={bank.contactPersonName} />
                <DetailRow
                  label="Designation"
                  value={
                    DESIGNATION_LABELS[bank.contactDesignation ?? "OTHER"]
                  }
                />
                <DetailRow label="Phone" value={bank.contactPhone} />
                <DetailRow label="Email" value={bank.officialEmail} />
              </dl>
            </div>

            <Separator className="my-5" />

            <div className="space-y-3">
              <h4 className="flex items-center gap-2 text-sm font-semibold">
                <MapPin className="h-4 w-4 text-primary" /> Location
              </h4>
              <dl className="space-y-2">
                <DetailRow label="Address" value={bank.addressLine} />
                <DetailRow label="City" value={bank.city} />
                <DetailRow label="District" value={bank.district} />
                <DetailRow label="State" value={bank.state} />
                <DetailRow label="Pincode" value={bank.pincode} />
              </dl>
            </div>

            {canVerify && (
              <>
                <Separator className="my-5" />
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Verification</h4>
                  <div className="flex flex-col gap-2">
                    {status !== "VERIFIED" && (
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-600/90 text-white"
                        onClick={() =>
                          onVerify({ bank, status: "VERIFIED" })
                        }
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Approve &amp; Verify
                      </Button>
                    )}
                    {status === "PENDING" && (
                      <Button
                        variant="destructive"
                        onClick={() =>
                          onVerify({ bank, status: "REJECTED" })
                        }
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject Registration
                      </Button>
                    )}
                    {status === "VERIFIED" && (
                      <Button
                        variant="destructive"
                        onClick={() =>
                          onVerify({ bank, status: "SUSPENDED" })
                        }
                      >
                        <PauseCircle className="mr-2 h-4 w-4" />
                        Suspend Institution
                      </Button>
                    )}
                    {(status === "REJECTED" || status === "SUSPENDED") && (
                      <p className="text-xs text-muted-foreground">
                        Approving will re-verify the institution and restore
                        request workflows.
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
