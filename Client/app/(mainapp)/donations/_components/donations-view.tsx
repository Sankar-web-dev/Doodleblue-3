"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Award,
  Calendar,
  CheckCircle2,
  Droplet,
  Droplets,
  Eye,
  Heart,
  HeartHandshake,
  Hospital,
  Loader2,
  MapPin,
  Search,
  UserRound,
} from "lucide-react";

import { Donation, donationsApi, MY_DONATIONS_KEY } from "@/api/donations.api";
import { useAuthUser } from "@/lib/use-auth-user";
import { usePermissions } from "@/lib/permissions";
import { ForbiddenState } from "../../_components/forbidden-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BLOOD_GROUP_LABELS, COMPONENT_LABELS } from "../../requests/_lib/request-form";
import { DonationCertificateDialog } from "./donation-certificate-dialog";

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function DonationsView() {
  const { user, isPending: userPending } = useAuthUser();
  const { can } = usePermissions(user);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedCertificate, setSelectedCertificate] = useState<Donation | null>(null);

  const { data, isPending, error } = useQuery({
    queryKey: MY_DONATIONS_KEY,
    queryFn: () => donationsApi.listMine(100),
  });

  // Deduplicate donations so multiple draft/screening attempts or duplicate rows for the same request merge into 1 card
  const uniqueDonations = useMemo(() => {
    const raw = data?.data ?? [];
    const statusPriority: Record<string, number> = {
      COMPLETED: 4,
      APPROVED: 3,
      SCREENING: 2,
      REGISTERED: 1,
      DEFERRED: 0,
      CANCELLED: -1,
    };

    const map = new Map<string, Donation>();
    for (const d of raw) {
      const key = d.requestId ? `req_${d.requestId}` : `don_${d.id}`;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, d);
      } else {
        const existingPriority = statusPriority[existing.status] ?? 0;
        const currentPriority = statusPriority[d.status] ?? 0;
        if (currentPriority > existingPriority) {
          map.set(key, d);
        } else if (currentPriority === existingPriority) {
          if (new Date(d.createdAt).getTime() > new Date(existing.createdAt).getTime()) {
            map.set(key, d);
          }
        }
      }
    }
    return Array.from(map.values());
  }, [data]);

  // Aggregate impact metrics
  const completedDonations = useMemo(
    () => uniqueDonations.filter((d) => d.status === "COMPLETED"),
    [uniqueDonations]
  );

  const totalUnits = useMemo(
    () =>
      completedDonations.reduce(
        (sum, d) => sum + (d.unitsDonated > 0 ? d.unitsDonated : 1),
        0
      ),
    [completedDonations]
  );

  const livesImpacted = totalUnits * 3;

  // Filtered donations
  const filteredDonations = useMemo(() => {
    return uniqueDonations.filter((d) => {
      if (statusFilter === "REGISTERED") {
        if (d.status !== "REGISTERED" && d.status !== "SCREENING") return false;
      } else if (statusFilter !== "ALL" && d.status !== statusFilter) {
        return false;
      }
      if (!search.trim()) return true;
      const term = search.toLowerCase();
      const patient = d.request?.patientName?.toLowerCase() ?? "";
      const hospital = d.request?.hospitalName?.toLowerCase() ?? "";
      const city = d.request?.city?.toLowerCase() ?? "";
      const bloodGroup = d.request?.bloodGroup?.toLowerCase() ?? "";
      return (
        patient.includes(term) ||
        hospital.includes(term) ||
        city.includes(term) ||
        bloodGroup.includes(term)
      );
    });
  }, [uniqueDonations, search, statusFilter]);

  if (userPending) return null;
  if (!can("donations", "read")) {
    return (
      <ForbiddenState message="You don't have permission to view donations." />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            My Blood Donations
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View your life-saving donations, certificates, and details of the recipients you supported.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild className="gap-2 shrink-0">
          <Link href="/responses">
            <HeartHandshake className="h-4 w-4" />
            View Active Responses
          </Link>
        </Button>
      </div>

      {/* Hero Impact Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Total Units */}
        <Card className="border-border/80 shadow-xs">
          <CardContent className="flex items-center gap-3.5 p-4 sm:p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Droplets className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-2xl font-black leading-tight text-foreground">
                {isPending ? "…" : totalUnits}
              </p>
              <p className="text-xs font-medium text-muted-foreground">
                Units Donated
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Lives Impacted */}
        <Card className="border-border/80 shadow-xs">
          <CardContent className="flex items-center gap-3.5 p-4 sm:p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
              <Heart className="h-5 w-5 fill-current" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-2xl font-black leading-tight text-foreground">
                {isPending ? "…" : livesImpacted}
              </p>
              <p className="text-xs font-medium text-muted-foreground">
                Lives Impacted
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Completed Donations */}
        <Card className="border-border/80 shadow-xs">
          <CardContent className="flex items-center gap-3.5 p-4 sm:p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-2xl font-black leading-tight text-foreground">
                {isPending ? "…" : completedDonations.length}
              </p>
              <p className="text-xs font-medium text-muted-foreground">
                Completed
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Donor Level */}
        <Card className="border-border/80 shadow-xs">
          <CardContent className="flex items-center gap-3.5 p-4 sm:p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Award className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-sm font-bold leading-tight text-foreground truncate">
                {totalUnits >= 5
                  ? "Gold Champion"
                  : totalUnits >= 2
                    ? "Silver Life Saver"
                    : totalUnits >= 1
                      ? "Bronze Donor"
                      : "Pioneer"}
              </p>
              <p className="text-xs font-medium text-muted-foreground">
                Milestone Status
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search recipient or hospital…"
            className="pl-9 h-9 text-xs"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "ALL", label: "All Donations" },
            { id: "COMPLETED", label: "Completed" },
            { id: "REGISTERED", label: "In Progress" },
          ].map((tab) => (
            <Button
              key={tab.id}
              size="sm"
              variant={statusFilter === tab.id ? "default" : "outline"}
              className="h-8 text-xs font-medium"
              onClick={() => setStatusFilter(tab.id)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {isPending && (
        <div className="flex min-h-[30vh] items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          Loading your donation history…
        </div>
      )}

      {/* Error state */}
      {error && !isPending && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center text-sm text-destructive">
          Could not load your donation records. Please try again.
        </div>
      )}

      {/* Empty state */}
      {!isPending && !error && filteredDonations.length === 0 && (
        <Card className="border-border/80 shadow-xs">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <HeartHandshake className="h-7 w-7" />
            </div>
            <h3 className="mt-4 font-display text-lg font-bold text-foreground">
              {search ? "No matching donations found" : "No completed donations yet"}
            </h3>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              {search
                ? "Try searching for a different patient, hospital, or city."
                : "When you respond to a blood request and your donation is completed, the verified details and your Life-Saving Certificate will appear here."}
            </p>
            {!search && (
              <Button asChild size="sm" className="mt-4 gap-2">
                <Link href="/requests">
                  <Droplet className="h-4 w-4" />
                  Browse Blood Requests
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Donation Cool Cards Grid */}
      {!isPending && !error && filteredDonations.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDonations.map((donation) => {
            const req = donation.request;
            const bgLabel = req?.bloodGroup
              ? BLOOD_GROUP_LABELS[req.bloodGroup] ?? req.bloodGroup
              : "Blood";
            const isCompleted = donation.status === "COMPLETED";
            const units = donation.unitsDonated || 1;
            const dateStr = formatDate(donation.donationDate || donation.createdAt);
            const isRecipientAppeal = req?.requestType === "RECIPIENT";

            return (
              <Card
                key={donation.id}
                className="group relative overflow-hidden border-border/80 bg-card transition-all hover:border-primary/40 hover:shadow-md"
              >
                {/* Gradient top accent strip */}
                <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 via-primary to-amber-500" />

                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-xs font-bold text-rose-600 dark:text-rose-400">
                        {bgLabel}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-foreground leading-tight">
                          {req?.component
                            ? (COMPONENT_LABELS[req.component as keyof typeof COMPONENT_LABELS] ?? req.component)
                            : "Whole Blood"}
                        </p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {dateStr}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        isCompleted
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px]"
                          : "bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px]"
                      }
                    >
                      {isCompleted ? "Completed" : "In Progress"}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 p-4 pt-1">
                  {/* Recipient Details Card Section */}
                  <div className="rounded-xl border border-border/70 bg-muted/30 p-3 space-y-1.5 text-xs">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Whom You Donated To
                    </p>
                    <div className="flex items-start gap-2">
                      <UserRound className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-foreground truncate">
                          {req?.patientName
                            ? req.patientName
                            : (req?.hospitalName || "Emergency Blood Appeal")}
                        </p>
                        {isRecipientAppeal && req?.creator?.name && (
                          <p className="text-[11px] text-muted-foreground truncate">
                            Organized by {req.creator.name}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-2 pt-0.5">
                      <Hospital className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-medium text-foreground truncate">
                          {req?.hospitalName || "Authorized Hospital"}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                          <MapPin className="h-2.5 w-2.5" />
                          {[req?.city, req?.state].filter(Boolean).join(", ") || "City Center"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Donation Specs */}
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="rounded-lg bg-background p-2 border border-border/60">
                      <span className="text-[10px] text-muted-foreground block">Contribution</span>
                      <span className="font-bold text-primary">
                        {units} {units === 1 ? "Unit" : "Units"}
                      </span>
                    </div>
                    <div className="rounded-lg bg-background p-2 border border-border/60">
                      <span className="text-[10px] text-muted-foreground block">Est. Impact</span>
                      <span className="font-bold text-emerald-600">
                        {units * 3} Lives Touched
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 border-t border-border/50 pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 text-xs text-primary hover:text-primary"
                      disabled={!isCompleted}
                      title={
                        isCompleted
                          ? undefined
                          : "Certificate unlocks once the donation is completed"
                      }
                      onClick={() => setSelectedCertificate(donation)}
                    >
                      <Award className="h-3.5 w-3.5 text-amber-500" />
                      Certificate
                    </Button>

                    {req?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 text-xs text-muted-foreground"
                        asChild
                      >
                        <Link href={`/notification/${req.id}`}>
                          <Eye className="h-3.5 w-3.5" />
                          View Appeal
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Certificate Modal */}
      <DonationCertificateDialog
        donation={selectedCertificate}
        donorName={user?.name ?? "Valued Donor"}
        onClose={() => setSelectedCertificate(null)}
      />
    </div>
  );
}
