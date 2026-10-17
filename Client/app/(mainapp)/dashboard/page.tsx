"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  ShieldCheck,
  UserCheck,
  KeyRound,
  ArrowRight,
  UserPlus,
  ShieldPlus,
  Loader2,
  Droplet,
  Heart,
  Calendar,
  Phone,
  MapPin,
  Scale,
  Sparkles,
  Activity,
  CheckCircle2,
  AlertTriangle,
  FileEdit,
  HeartHandshake,
} from "lucide-react";

import { useAuthUser } from "@/lib/use-auth-user";
import { useUsers } from "../users/_hooks/use-users";
import { useRoles } from "../roles/_hooks/use-roles";
import {
  profilesApi,
  PROFILES_DONOR_KEY,
  PROFILES_PERSONAL_KEY,
  PROFILES_RECIPIENT_KEY,
} from "@/api/profiles.api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { initials } from "../_components/console-utils";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const BLOOD_GROUP_NAMES: Record<string, string> = {
  O_POSITIVE: "O+",
  O_NEGATIVE: "O-",
  A_POSITIVE: "A+",
  A_NEGATIVE: "A-",
  B_POSITIVE: "B+",
  B_NEGATIVE: "B-",
  AB_POSITIVE: "AB+",
  AB_NEGATIVE: "AB-",
  UNKNOWN: "Unknown",
};

export default function DashboardPage() {
  const { user } = useAuthUser();
  const firstName = user?.name.split(" ")[0] ?? "there";

  const isDonor =
    (user?.role || "").toLowerCase().includes("dona") ||
    (user?.role || "").toLowerCase().includes("donor");
  const isRecipient = (user?.role || "")
    .toLowerCase()
    .includes("recipient");

  // Admin stats
  const { data: usersData, isPending: usersPending } = useUsers();
  const { data: rolesData, isPending: rolesPending } = useRoles();

  // Donor queries
  const { data: donorData, isPending: donorPending } = useQuery({
    queryKey: PROFILES_DONOR_KEY,
    queryFn: () => profilesApi.getDonorProfile().then((res) => res.profile),
    enabled: isDonor,
  });

  // Recipient queries
  const { data: recipientData, isPending: recipientPending } = useQuery({
    queryKey: PROFILES_RECIPIENT_KEY,
    queryFn: () => profilesApi.getRecipientProfile().then((res) => res.profile),
    enabled: isRecipient,
  });

  const { data: personalData, isPending: personalPending } = useQuery({
    queryKey: PROFILES_PERSONAL_KEY,
    queryFn: () => profilesApi.getPersonalProfile().then((res) => res.profile),
    enabled: isDonor || isRecipient,
  });

  // -------------------------------------------------------------------------
  // DONOR DASHBOARD VIEW
  // -------------------------------------------------------------------------
  if (isDonor) {
    const isDonorLoading = donorPending || personalPending;
    const profileCompleted = !!donorData?.profileCompleted;
    const isAvailable = !!donorData?.isAvailable;
    const bloodGroupLabel = donorData?.bloodGroup
      ? BLOOD_GROUP_NAMES[donorData.bloodGroup] ?? donorData.bloodGroup
      : "Not Set";

    return (
      <div className="flex flex-col gap-8">
        {/* Donor Greeting */}
        <div className="animate-fade-up flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-display text-3xl font-bold tracking-tight">
                {greeting()}, {firstName}
              </h1>
              <Badge variant="outline" className="border-primary/40 text-primary">
                Blood Donor
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}{" "}
              — Welcome to your Donor Care Portal.
            </p>
          </div>

          <Link href="/onboarding/donor">
            <Button variant="outline" className="gap-2 border-border/80">
              <FileEdit className="h-4 w-4" />
              {profileCompleted ? "Update Health Details" : "Complete Onboarding"}
            </Button>
          </Link>
        </div>

        {/* Incomplete Onboarding Banner */}
        {!isDonorLoading && !profileCompleted && (
          <Card className="animate-fade-up border-primary/40 bg-primary/5 shadow-xs">
            <CardContent className="flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-foreground">
                    Donor Health Screening Incomplete
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground max-w-xl">
                    Please complete your 6-step health and physical assessment stepper form. Once verified, you will be active in our hospital emergency registry.
                  </p>
                </div>
              </div>
              <Link href="/onboarding/donor">
                <Button className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2">
                  Launch Onboarding Stepper <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Donor Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* Blood Type */}
          <Card className="animate-fade-up border-border/80 shadow-xs">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Droplet className="h-5 w-5 fill-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-display text-2xl font-black leading-none tracking-tight text-primary">
                  {isDonorLoading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : bloodGroupLabel}
                </p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">Blood Group</p>
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card className="animate-fade-up border-border/80 shadow-xs">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
                isAvailable ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 text-amber-600"
              }`}>
                {isAvailable ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
              </div>
              <div className="min-w-0">
                <p className="font-display text-xl font-bold leading-none tracking-tight">
                  {isDonorLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : profileCompleted ? (
                    isAvailable ? "Active Donor" : "Deferred / Paused"
                  ) : (
                    "Incomplete"
                  )}
                </p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">
                  {isAvailable ? "Ready for alerts" : "Standby status"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Donations Made */}
          <Card className="animate-fade-up border-border/80 shadow-xs">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-tertiary/15 text-tertiary">
                <HeartHandshake className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-display text-2xl font-bold leading-none tracking-tight">
                  {isDonorLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : (
                    donorData?.previousDonationCount ?? 0
                  )}
                </p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">Total Donations Made</p>
              </div>
            </CardContent>
          </Card>

          {/* Travel Range */}
          <Card className="animate-fade-up border-border/80 shadow-xs">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-display text-2xl font-bold leading-none tracking-tight">
                  {isDonorLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : (
                    `${donorData?.maxTravelDistanceKm ?? 25} km`
                  )}
                </p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">Coverage Radius</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Donor Profile Summary Card */}
          <Card className="animate-fade-up border-border/80 lg:col-span-2 shadow-xs">
            <CardHeader className="flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg">Donor Identity &amp; Clinical Record</CardTitle>
                <CardDescription>Verified details from your medical screening</CardDescription>
              </div>
              <Link href="/onboarding/donor">
                <Button size="sm" variant="ghost" className="text-xs text-primary gap-1">
                  Edit <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4 pt-1">
              <div className="grid grid-cols-2 gap-4 rounded-xl border border-border/70 bg-muted/20 p-4 sm:grid-cols-3">
                <div>
                  <span className="text-[11px] font-semibold uppercase text-muted-foreground">Weight &amp; Height</span>
                  <p className="mt-0.5 text-sm font-bold text-foreground">
                    {donorData?.weightKg ? `${donorData.weightKg} kg` : "—"} / {donorData?.heightCm ? `${donorData.heightCm} cm` : "—"}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase text-muted-foreground">Location</span>
                  <p className="mt-0.5 text-sm font-bold text-foreground">
                    {personalData?.city ? `${personalData.city}, ${personalData.state}` : "—"}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase text-muted-foreground">Contact Phone</span>
                  <p className="mt-0.5 text-sm font-bold text-foreground">
                    {personalData?.phoneNumber || "—"}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase text-muted-foreground">Contact Preference</span>
                  <p className="mt-0.5 text-sm font-bold text-foreground">
                    {donorData?.contactPreference || "BOTH"}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase text-muted-foreground">Travel Preference</span>
                  <p className="mt-0.5 text-sm font-bold text-foreground">
                    {donorData?.travelPreference === "ANYWHERE" ? "Statewide" : "Nearby Hospitals"}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase text-muted-foreground">Last Donation</span>
                  <p className="mt-0.5 text-sm font-bold text-foreground">
                    {donorData?.lastDonationDate
                      ? new Date(donorData.lastDonationDate).toLocaleDateString()
                      : "First time donor"}
                  </p>
                </div>
              </div>

              {/* Health Guidance Box */}
              <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <span className="font-semibold text-foreground">Next Scheduled Donation Safety Guideline:</span>
                  <p className="mt-0.5">
                    Remember to stay hydrated and avoid alcohol for 24 hours prior to responding to requests. Each unit of whole blood can save up to three lives.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions & Links */}
          <Card className="animate-fade-up border-border/80 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <CardDescription>Donor portal navigation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-1">
              <Link
                href="/onboarding/donor"
                className="group flex items-center gap-3 rounded-xl border border-border/80 p-3.5 transition-all hover:border-primary/40 hover:bg-muted/40"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Activity className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">Health Screening Stepper</p>
                  <p className="text-xs text-muted-foreground truncate">Re-evaluate donor eligibility</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>

              <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Blood Group Compatibility
                </h4>
                <div className="space-y-1 text-xs">
                  <p className="text-foreground font-semibold">Your Group: {bloodGroupLabel}</p>
                  <p className="text-muted-foreground">
                    Matches compatible emergency recipients in nearby authorized blood banks.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // RECIPIENT DASHBOARD VIEW
  // -------------------------------------------------------------------------
  if (isRecipient) {
    const isRecipientLoading = recipientPending || personalPending;
    const profileCompleted = !!recipientData?.profileCompleted;
    const registrationLabel =
      recipientData?.registrationFor === "SOMEONE_ELSE"
        ? "Someone Else"
        : "Myself";

    return (
      <div className="flex flex-col gap-8">
        {/* Recipient Greeting */}
        <div className="animate-fade-up flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-display text-3xl font-bold tracking-tight">
                {greeting()}, {firstName}
              </h1>
              <Badge variant="outline" className="border-primary/40 text-primary">
                Blood Recipient
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}{" "}
              — Welcome to your Recipient Care Portal.
            </p>
          </div>

          <Link href="/onboarding/recipient">
            <Button variant="outline" className="gap-2 border-border/80">
              <FileEdit className="h-4 w-4" />
              {profileCompleted ? "Update Details" : "Complete Onboarding"}
            </Button>
          </Link>
        </div>

        {/* Incomplete Onboarding Banner */}
        {!isRecipientLoading && !profileCompleted && (
          <Card className="animate-fade-up border-primary/40 bg-primary/5 shadow-xs">
            <CardContent className="flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-foreground">
                    Recipient Onboarding Incomplete
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground max-w-xl">
                    Please complete your 3-step recipient registration stepper
                    form. Once verified, you can create blood requests and get
                    matched with donors and blood banks.
                  </p>
                </div>
              </div>
              <Link href="/onboarding/recipient">
                <Button className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2">
                  Launch Onboarding Stepper <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Recipient Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* Registration For */}
          <Card className="animate-fade-up border-border/80 shadow-xs">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <HeartHandshake className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-display text-xl font-bold leading-none tracking-tight">
                  {isRecipientLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : (
                    registrationLabel
                  )}
                </p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">Registering For</p>
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card className="animate-fade-up border-border/80 shadow-xs">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
                profileCompleted ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 text-amber-600"
              }`}>
                {profileCompleted ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
              </div>
              <div className="min-w-0">
                <p className="font-display text-xl font-bold leading-none tracking-tight">
                  {isRecipientLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : profileCompleted ? (
                    "Active Recipient"
                  ) : (
                    "Incomplete"
                  )}
                </p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">
                  {profileCompleted ? "Ready to request" : "Onboarding pending"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Relationship */}
          <Card className="animate-fade-up border-border/80 shadow-xs">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-tertiary/15 text-tertiary">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-display text-xl font-bold leading-none tracking-tight">
                  {isRecipientLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : recipientData?.registrationFor === "SOMEONE_ELSE" ? (
                    recipientData?.relationshipToPatient || "—"
                  ) : (
                    "Self"
                  )}
                </p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">Patient Relationship</p>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card className="animate-fade-up border-border/80 shadow-xs">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-display text-xl font-bold leading-none tracking-tight truncate">
                  {isRecipientLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : personalData?.city ? (
                    `${personalData.city}${personalData.state ? `, ${personalData.state}` : ""}`
                  ) : (
                    "—"
                  )}
                </p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">Location</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Recipient Profile Summary Card */}
          <Card className="animate-fade-up border-border/80 lg:col-span-2 shadow-xs">
            <CardHeader className="flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg">Recipient Identity &amp; Request Context</CardTitle>
                <CardDescription>Details from your registration</CardDescription>
              </div>
              <Link href="/onboarding/recipient">
                <Button size="sm" variant="ghost" className="text-xs text-primary gap-1">
                  Edit <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4 pt-1">
              <div className="grid grid-cols-2 gap-4 rounded-xl border border-border/70 bg-muted/20 p-4 sm:grid-cols-3">
                <div>
                  <span className="text-[11px] font-semibold uppercase text-muted-foreground">Registering For</span>
                  <p className="mt-0.5 text-sm font-bold text-foreground">{registrationLabel}</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase text-muted-foreground">Relationship</span>
                  <p className="mt-0.5 text-sm font-bold text-foreground">
                    {recipientData?.registrationFor === "SOMEONE_ELSE"
                      ? recipientData?.relationshipToPatient || "—"
                      : "Self"}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase text-muted-foreground">Contact Phone</span>
                  <p className="mt-0.5 text-sm font-bold text-foreground">
                    {personalData?.phoneNumber || "—"}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase text-muted-foreground">Location</span>
                  <p className="mt-0.5 text-sm font-bold text-foreground">
                    {personalData?.city ? `${personalData.city}, ${personalData.state}` : "—"}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase text-muted-foreground">Pincode</span>
                  <p className="mt-0.5 text-sm font-bold text-foreground">
                    {personalData?.pincode || "—"}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase text-muted-foreground">Profile Status</span>
                  <p className="mt-0.5 text-sm font-bold text-foreground">
                    {profileCompleted ? "Completed" : "Incomplete"}
                  </p>
                </div>
              </div>

              {/* Guidance Box */}
              <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <span className="font-semibold text-foreground">Requesting Blood:</span>
                  <p className="mt-0.5">
                    Keep your recipient details current so verified donors and blood
                    banks can respond to your requests quickly. You can update them
                    anytime from the onboarding stepper.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions & Links */}
          <Card className="animate-fade-up border-border/80 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <CardDescription>Recipient portal navigation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-1">
              <Link
                href="/onboarding/recipient"
                className="group flex items-center gap-3 rounded-xl border border-border/80 p-3.5 transition-all hover:border-primary/40 hover:bg-muted/40"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Activity className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">Onboarding Stepper</p>
                  <p className="text-xs text-muted-foreground truncate">Update recipient details</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>

              <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Blood Requests
                </h4>
                <div className="space-y-1 text-xs">
                  <p className="text-foreground font-semibold">
                    {profileCompleted ? "Ready to create" : "Complete onboarding first"}
                  </p>
                  <p className="text-muted-foreground">
                    Requests are matched with compatible donors in nearby authorized blood banks.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // ADMIN DASHBOARD VIEW (Original)
  // -------------------------------------------------------------------------
  const users = usersData?.data ?? [];
  const roles = rolesData?.data ?? [];
  const isPending = usersPending || rolesPending;

  const activeUsers = users.filter((u) => u.isActive).length;
  const pendingResets = users.filter((u) => u.mustChangePassword).length;
  const recentUsers = [...users]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 5);

  const stats = [
    {
      label: "Total users",
      value: usersData?.meta?.total ?? users.length,
      icon: Users,
      tint: "bg-primary/10 text-primary",
    },
    {
      label: "Active accounts",
      value: activeUsers,
      icon: UserCheck,
      tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Roles",
      value: rolesData?.meta?.total ?? roles.length,
      icon: ShieldCheck,
      tint: "bg-tertiary/15 text-tertiary",
    },
    {
      label: "Pending resets",
      value: pendingResets,
      icon: KeyRound,
      tint: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Greeting */}
      <div className="animate-fade-up">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {greeting()}, {firstName}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}{" "}
          — here&apos;s what&apos;s happening across your workspace.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, i) => (
          <Card
            key={stat.label}
            className="animate-fade-up border-border/80 shadow-xs"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${stat.tint}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-display text-2xl font-bold leading-none tracking-tight">
                  {isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : (
                    stat.value
                  )}
                </p>
                <p className="mt-1.5 text-xs font-medium text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Recent users */}
        <Card className="animate-fade-up border-border/80 lg:col-span-2 shadow-xs" style={{ animationDelay: "240ms" }}>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="font-display text-base">Recent users</CardTitle>
            <Link
              href="/users"
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            {usersPending ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading users…
              </div>
            ) : recentUsers.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No users yet.
              </p>
            ) : (
              <ul className="divide-y divide-border/60">
                {recentUsers.map((u) => (
                  <li key={u.id} className="flex items-center gap-3 py-3">
                    {u.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={u.image}
                        alt={u.name}
                        className="h-9 w-9 shrink-0 rounded-lg border border-border object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                        {initials(u.name)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{u.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {u.email}
                      </p>
                    </div>
                    <Badge variant={u.isActive ? "success" : "secondary"}>
                      {u.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <span className="hidden text-xs text-muted-foreground sm:block">
                      {u.role}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card className="animate-fade-up border-border/80 shadow-xs" style={{ animationDelay: "300ms" }}>
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-base">Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <Link
              href="/users/create"
              className="group flex items-center gap-3 rounded-lg border border-border/80 bg-card p-3.5 transition-all hover:border-primary/40 hover:bg-accent"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <UserPlus className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Provision user</p>
                <p className="text-xs text-muted-foreground">
                  Create an account &amp; email credentials
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
            <Link
              href="/roles/create"
              className="group flex items-center gap-3 rounded-lg border border-border/80 bg-card p-3.5 transition-all hover:border-primary/40 hover:bg-accent"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-tertiary/15 text-tertiary">
                <ShieldPlus className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Create role</p>
                <p className="text-xs text-muted-foreground">
                  Define a new permission matrix
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
