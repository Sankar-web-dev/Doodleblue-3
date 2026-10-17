"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Heart,
  User,
  Activity,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  Phone,
  MapPin,
  Scale,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Compass,
  FileText,
  BadgeAlert,
  Loader2,
  Droplet,
  Home,
  Info,
} from "lucide-react";

import { useAuthUser } from "@/lib/use-auth-user";
import {
  profilesApi,
  PROFILES_DONOR_KEY,
  PROFILES_PERSONAL_KEY,
  Gender,
  MaritalStatus,
  BloodGroup,
  TravelPreference,
  ContactPreference,
} from "@/api/profiles.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ---------------------------------------------------------------------------
// Form Types
// ---------------------------------------------------------------------------

export interface DonorOnboardingFormValues {
  // Step 1: Personal Details
  dateOfBirth: string;
  gender: Gender;
  phoneNumber: string;
  maritalStatus: MaritalStatus;
  addressLine: string;
  city: string;
  district: string;
  state: string;
  pincode: string;

  // Step 2: Physical & Blood Profile
  bloodGroup: BloodGroup;
  heightCm: number;
  weightKg: number;
  donatedBefore: boolean;
  previousDonationCount: number;
  lastDonationDate: string;

  // Step 3: Health History & Medical Screening
  hasSeriousMedicalCondition: boolean;
  medicalConditionDetails: string;
  hasDiabetes: boolean;
  diabetesLevel: string;
  takesMedication: boolean;
  medicationDetails: string;
  hasHadSurgery: boolean;
  lastSurgeryDate: string;
  hasTattoo: boolean;
  tattooDate: string;
  regularAlcoholUse: boolean;

  // Step 4: Gender Screening (Specific to Females)
  currentlyPregnant: boolean;
  recentPregnancyOrDelivery: boolean;
  lastPregnancyDate: string;

  // Step 5: Donation Preferences
  isAvailable: boolean;
  travelPreference: TravelPreference;
  maxTravelDistanceKm: number;
  contactPreference: ContactPreference;
}

const BLOOD_GROUPS: { label: string; value: BloodGroup; desc: string }[] = [
  { label: "O+", value: "O_POSITIVE", desc: "Universal red cell compatibility for Rh+" },
  { label: "O-", value: "O_NEGATIVE", desc: "Universal blood donor (Emergency ready)" },
  { label: "A+", value: "A_POSITIVE", desc: "High demand in surgical & cancer care" },
  { label: "A-", value: "A_NEGATIVE", desc: "Essential for A- and AB- patients" },
  { label: "B+", value: "B_POSITIVE", desc: "Frequent demand in clinical emergencies" },
  { label: "B-", value: "B_NEGATIVE", desc: "Rare and crucial blood type" },
  { label: "AB+", value: "AB_POSITIVE", desc: "Universal plasma donor" },
  { label: "AB-", value: "AB_NEGATIVE", desc: "Rarest blood group worldwide" },
];

interface DeferralReason {
  type: "CRITICAL" | "TEMPORARY" | "PRECAUTION";
  title: string;
  description: string;
  eligibleAfter?: string;
  stepToEdit: number;
}

// ---------------------------------------------------------------------------
// Eligibility Engine
// ---------------------------------------------------------------------------

function calculateAge(dobString: string): number {
  if (!dobString) return 0;
  const dob = new Date(dobString);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

function daysDiff(dateString: string): number {
  if (!dateString) return Infinity;
  const d = new Date(dateString);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function addMonthsToDate(dateString: string, months: number): string {
  const d = new Date(dateString);
  d.setMonth(d.getMonth() + months);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function addDaysToDate(dateString: string, days: number): string {
  const d = new Date(dateString);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function evaluateEligibility(data: DonorOnboardingFormValues): {
  isEligible: boolean;
  reasons: DeferralReason[];
  age: number;
  bmi: number;
} {
  const reasons: DeferralReason[] = [];
  const age = calculateAge(data.dateOfBirth);

  // 1. Age Verification (18 - 65)
  if (age < 18) {
    reasons.push({
      type: "CRITICAL",
      title: "Minimum Age Requirement (18+ Years)",
      description: `Donors must be at least 18 years of age. Your calculated age is ${age} years.`,
      stepToEdit: 1,
    });
  } else if (age > 65) {
    reasons.push({
      type: "CRITICAL",
      title: "Maximum Age Ceiling Exceeded (65 Years)",
      description: `First-time or routine donations after age 65 require in-person geriatric physician certification. Your age is ${age} years.`,
      stepToEdit: 1,
    });
  }

  // 2. Minimum Weight (50 kg)
  if (data.weightKg < 50) {
    reasons.push({
      type: "CRITICAL",
      title: "Weight Below Mandatory 50 kg Threshold",
      description: `To prevent adverse vasovagal reactions and hypovolemia, Indian and WHO safety norms mandate a minimum weight of 50 kg (110 lbs). Your recorded weight is ${data.weightKg} kg.`,
      stepToEdit: 2,
    });
  }

  // Calculate BMI
  const heightInMeters = (data.heightCm || 170) / 100;
  const bmi = Number((data.weightKg / (heightInMeters * heightInMeters)).toFixed(1));

  // 3. Donation Interval (Minimum 90 days)
  if (data.donatedBefore && data.lastDonationDate) {
    const elapsedDays = daysDiff(data.lastDonationDate);
    if (elapsedDays < 90) {
      reasons.push({
        type: "TEMPORARY",
        title: "Recent Donation (90-Day Safe Interval)",
        description: `A minimum 90-day recovery window is required between whole blood donations to allow bone marrow erythropoiesis and ferritin restoration. (${elapsedDays} days passed).`,
        eligibleAfter: addDaysToDate(data.lastDonationDate, 90),
        stepToEdit: 2,
      });
    }
  }

  // 4. Tattoo or Body Piercing (6-Month Deferral)
  if (data.hasTattoo && data.tattooDate) {
    const elapsedDays = daysDiff(data.tattooDate);
    if (elapsedDays < 180) {
      reasons.push({
        type: "TEMPORARY",
        title: "Recent Tattoo or Body Piercing (6-Month Window)",
        description: `National blood transfusion safety guidelines impose a mandatory 6-month deferral window following tattoo or body piercing procedures to eliminate window-period infection risks.`,
        eligibleAfter: addMonthsToDate(data.tattooDate, 6),
        stepToEdit: 3,
      });
    }
  }

  // 5. Recent Surgery (6-Month Deferral)
  if (data.hasHadSurgery && data.lastSurgeryDate) {
    const elapsedDays = daysDiff(data.lastSurgeryDate);
    if (elapsedDays < 180) {
      reasons.push({
        type: "TEMPORARY",
        title: "Recent Surgery Recovery Period (6 Months)",
        description: `A 6-month recovery period is required post-surgery to ensure full wound healing, normalization of blood counts, and zero post-op complications.`,
        eligibleAfter: addMonthsToDate(data.lastSurgeryDate, 6),
        stepToEdit: 3,
      });
    }
  }

  // 6. Serious Medical Conditions
  if (data.hasSeriousMedicalCondition) {
    reasons.push({
      type: "CRITICAL",
      title: "Chronic Medical Condition Reported",
      description: `Active cardiovascular diseases, epilepsy, bleeding disorders, hepatitis, or history of malignancy disqualify candidates for donor safety.`,
      stepToEdit: 3,
    });
  }

  // 7. Diabetes Status
  if (data.hasDiabetes && data.diabetesLevel === "INSULIN") {
    reasons.push({
      type: "CRITICAL",
      title: "Insulin-Dependent Diabetes",
      description: `Individuals requiring insulin therapy cannot donate blood due to cardiovascular fragility and sudden glycemic fluctuation risks.`,
      stepToEdit: 3,
    });
  }

  // 8. Gender Specific: Pregnancy & Delivery
  if (data.gender === "FEMALE") {
    if (data.currentlyPregnant) {
      reasons.push({
        type: "TEMPORARY",
        title: "Pregnancy Deferral",
        description: `Blood donation is deferred throughout pregnancy and active lactation to conserve maternal hemoglobin and ensure optimal fetal nourishment.`,
        stepToEdit: 4,
      });
    }

    if (data.recentPregnancyOrDelivery && data.lastPregnancyDate) {
      const elapsedDays = daysDiff(data.lastPregnancyDate);
      if (elapsedDays < 180) {
        reasons.push({
          type: "TEMPORARY",
          title: "Postpartum Recovery (6-Month Deferral)",
          description: `A minimum 6-month postpartum interval is mandatory to restore maternal iron stores.`,
          eligibleAfter: addMonthsToDate(data.lastPregnancyDate, 6),
          stepToEdit: 4,
        });
      }
    }
  }

  return {
    isEligible: reasons.length === 0,
    reasons,
    age,
    bmi,
  };
}

// ---------------------------------------------------------------------------
// Onboarding Stepper Component
// ---------------------------------------------------------------------------

export default function DonorOnboardingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isPending: authPending } = useAuthUser();

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;

  // React Hook Form
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<DonorOnboardingFormValues>({
    defaultValues: {
      dateOfBirth: "2000-01-01",
      gender: "MALE",
      phoneNumber: "",
      maritalStatus: "SINGLE",
      addressLine: "",
      city: "",
      district: "",
      state: "",
      pincode: "",

      bloodGroup: "O_POSITIVE",
      heightCm: 172,
      weightKg: 65,
      donatedBefore: false,
      previousDonationCount: 0,
      lastDonationDate: "",

      hasSeriousMedicalCondition: false,
      medicalConditionDetails: "",
      hasDiabetes: false,
      diabetesLevel: "NONE",
      takesMedication: false,
      medicationDetails: "",
      hasHadSurgery: false,
      lastSurgeryDate: "",
      hasTattoo: false,
      tattooDate: "",
      regularAlcoholUse: false,

      currentlyPregnant: false,
      recentPregnancyOrDelivery: false,
      lastPregnancyDate: "",

      isAvailable: true,
      travelPreference: "NEARBY",
      maxTravelDistanceKm: 25,
      contactPreference: "BOTH",
    },
    mode: "onChange",
  });

  const formValues = watch();

  // Load existing personal & donor profiles if already started
  const { data: existingPersonal } = useQuery({
    queryKey: PROFILES_PERSONAL_KEY,
    queryFn: () => profilesApi.getPersonalProfile().then((res) => res.profile),
    staleTime: 60_000,
  });

  const { data: existingDonor } = useQuery({
    queryKey: PROFILES_DONOR_KEY,
    queryFn: () => profilesApi.getDonorProfile().then((res) => res.profile),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (existingPersonal) {
      if (existingPersonal.phoneNumber) setValue("phoneNumber", existingPersonal.phoneNumber);
      if (existingPersonal.dateOfBirth) setValue("dateOfBirth", existingPersonal.dateOfBirth.slice(0, 10));
      if (existingPersonal.gender) setValue("gender", existingPersonal.gender);
      if (existingPersonal.maritalStatus) setValue("maritalStatus", existingPersonal.maritalStatus);
      if (existingPersonal.addressLine) setValue("addressLine", existingPersonal.addressLine);
      if (existingPersonal.city) setValue("city", existingPersonal.city);
      if (existingPersonal.district) setValue("district", existingPersonal.district);
      if (existingPersonal.state) setValue("state", existingPersonal.state);
      if (existingPersonal.pincode) setValue("pincode", existingPersonal.pincode);
    }
  }, [existingPersonal, setValue]);

  useEffect(() => {
    if (existingDonor) {
      if (existingDonor.bloodGroup) setValue("bloodGroup", existingDonor.bloodGroup);
      if (existingDonor.heightCm) setValue("heightCm", existingDonor.heightCm);
      if (existingDonor.weightKg) setValue("weightKg", existingDonor.weightKg);
      if (existingDonor.donatedBefore !== undefined) setValue("donatedBefore", !!existingDonor.donatedBefore);
      if (existingDonor.previousDonationCount) setValue("previousDonationCount", existingDonor.previousDonationCount);
      if (existingDonor.lastDonationDate) setValue("lastDonationDate", existingDonor.lastDonationDate.slice(0, 10));
      if (existingDonor.hasTattoo !== undefined) setValue("hasTattoo", !!existingDonor.hasTattoo);
      if (existingDonor.tattooDate) setValue("tattooDate", existingDonor.tattooDate.slice(0, 10));
      if (existingDonor.hasHadSurgery !== undefined) setValue("hasHadSurgery", !!existingDonor.hasHadSurgery);
      if (existingDonor.lastSurgeryDate) setValue("lastSurgeryDate", existingDonor.lastSurgeryDate.slice(0, 10));
      if (existingDonor.hasDiabetes !== undefined) setValue("hasDiabetes", !!existingDonor.hasDiabetes);
      if (existingDonor.diabetesLevel) setValue("diabetesLevel", existingDonor.diabetesLevel);
      if (existingDonor.hasSeriousMedicalCondition !== undefined) setValue("hasSeriousMedicalCondition", !!existingDonor.hasSeriousMedicalCondition);
      if (existingDonor.medicalConditionDetails) setValue("medicalConditionDetails", existingDonor.medicalConditionDetails);
      if (existingDonor.travelPreference) setValue("travelPreference", existingDonor.travelPreference);
      if (existingDonor.maxTravelDistanceKm) setValue("maxTravelDistanceKm", existingDonor.maxTravelDistanceKm);
      if (existingDonor.contactPreference) setValue("contactPreference", existingDonor.contactPreference);
    }
  }, [existingDonor, setValue]);

  const isUpdateMode = Boolean(existingDonor?.profileCompleted || existingDonor?.bloodGroup);

  // Eligibility evaluation calculation
  const evaluation = useMemo(() => evaluateEligibility(formValues), [formValues]);

  const toIso = (val?: string) => {
    if (!val || !val.trim()) return undefined;
    const d = new Date(val);
    return isNaN(d.getTime()) ? undefined : d.toISOString();
  };

  // Saving mutations
  const saveMutation = useMutation({
    mutationFn: async (isEligible: boolean) => {
      // 1. Save Personal Profile
      await profilesApi.upsertPersonalProfile({
        dateOfBirth: toIso(formValues.dateOfBirth),
        gender: formValues.gender,
        phoneNumber: formValues.phoneNumber.trim() || undefined,
        maritalStatus: formValues.maritalStatus,
        addressLine: formValues.addressLine.trim() || undefined,
        city: formValues.city.trim() || undefined,
        district: formValues.district.trim() || undefined,
        state: formValues.state.trim() || undefined,
        pincode: formValues.pincode.trim() || undefined,
      });

      // 2. Save Donor Profile
      await profilesApi.upsertDonorProfile({
        bloodGroup: formValues.bloodGroup,
        heightCm: Number(formValues.heightCm),
        weightKg: Number(formValues.weightKg),
        donatedBefore: formValues.donatedBefore,
        previousDonationCount: formValues.donatedBefore ? Number(formValues.previousDonationCount) : 0,
        lastDonationDate: formValues.donatedBefore ? toIso(formValues.lastDonationDate) : undefined,
        takesMedication: formValues.takesMedication,
        medicationDetails: formValues.takesMedication ? formValues.medicationDetails : undefined,
        hasTattoo: formValues.hasTattoo,
        tattooDate: formValues.hasTattoo ? toIso(formValues.tattooDate) : undefined,
        hasSeriousMedicalCondition: formValues.hasSeriousMedicalCondition,
        medicalConditionDetails: formValues.hasSeriousMedicalCondition ? formValues.medicalConditionDetails : undefined,
        hasDiabetes: formValues.hasDiabetes,
        diabetesLevel: formValues.hasDiabetes ? formValues.diabetesLevel : undefined,
        hasHadSurgery: formValues.hasHadSurgery,
        lastSurgeryDate: formValues.hasHadSurgery ? toIso(formValues.lastSurgeryDate) : undefined,
        regularAlcoholUse: formValues.regularAlcoholUse,
        currentlyPregnant: formValues.gender === "FEMALE" ? formValues.currentlyPregnant : false,
        recentPregnancyOrDelivery: formValues.gender === "FEMALE" ? formValues.recentPregnancyOrDelivery : false,
        lastPregnancyDate: formValues.gender === "FEMALE" && formValues.recentPregnancyOrDelivery ? toIso(formValues.lastPregnancyDate) : undefined,
        isAvailable: isEligible && formValues.isAvailable,
        travelPreference: formValues.travelPreference,
        maxTravelDistanceKm: Number(formValues.maxTravelDistanceKm),
        contactPreference: formValues.contactPreference,
      });
    },
    onSuccess: (_, isEligible) => {
      queryClient.invalidateQueries({ queryKey: PROFILES_PERSONAL_KEY });
      queryClient.invalidateQueries({ queryKey: PROFILES_DONOR_KEY });

      if (isEligible) {
        toast.success(isUpdateMode ? "Updated successfully!" : "Onboarding Completed!", {
          description: isUpdateMode
            ? "Your donor health information has been updated."
            : "Your donor profile is active and verified. Redirecting to your dashboard...",
        });
        setTimeout(() => {
          router.replace("/dashboard");
        }, 1200);
      } else {
        toast.info(isUpdateMode ? "Updated successfully!" : "Profile Saved as Deferred", {
          description: isUpdateMode
            ? "Your donor profile has been updated in deferred status."
            : "We've recorded your profile. You can re-verify once eligibility criteria are satisfied.",
        });
        router.replace("/dashboard");
      }
    },
    onError: (err: unknown) => {
      toast.error("Failed to save profile", {
        description: err instanceof Error ? err.message : "Please check your network and try again.",
      });
    },
  });

  // Step Validation Handlers
  const handleNextStep = async () => {
    let isValid = false;

    if (currentStep === 1) {
      isValid = await trigger(["dateOfBirth", "gender", "phoneNumber", "city", "state", "pincode"]);
      if (!isValid) {
        toast.error("Please fill required personal details", {
          description: "Make sure your birth date, phone, and location fields are filled correctly.",
        });
        return;
      }
    } else if (currentStep === 2) {
      isValid = await trigger(["bloodGroup", "heightCm", "weightKg"]);
      if (!isValid) {
        toast.error("Please enter physical details", {
          description: "Height and weight are required for donor assessment.",
        });
        return;
      }
    } else if (currentStep === 3) {
      isValid = true; // Booleans with defaults
    } else if (currentStep === 4) {
      isValid = true;
    } else if (currentStep === 5) {
      isValid = true;
    }

    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const jumpToStep = (stepNumber: number) => {
    setCurrentStep(stepNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (authPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ambient-mesh">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stepsMetadata = [
    { num: 1, title: "Personal Details", icon: User, desc: "Identity & Location" },
    { num: 2, title: "Physical & Blood", icon: Droplet, desc: "Group, Height & Weight" },
    { num: 3, title: "Medical Screening", icon: Activity, desc: "Health & Surgical History" },
    { num: 4, title: "Gender Screening", icon: Heart, desc: "Clinical Safety Check" },
    { num: 5, title: "Preferences", icon: Compass, desc: "Availability & Travel" },
    { num: 6, title: "Health Assessment", icon: ShieldCheck, desc: "Eligibility Verification" },
  ];

  return (
    <div className="min-h-screen bg-ambient-mesh px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Top Header */}
        <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-border/80 bg-card/90 p-6 shadow-sm backdrop-blur-md sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-xs">
              <Droplet className="h-6 w-6 fill-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl font-bold tracking-tight">
                  {isUpdateMode ? "Update Donor Health Details" : "Blood Donor Onboarding"}
                </h1>
                <Badge variant="outline" className="border-primary/30 text-primary">
                  {isUpdateMode ? "Update Health Mode" : "Role: Blood Donar"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {isUpdateMode
                  ? "Edit and review your clinical screening parameters, availability, and preferences."
                  : "Complete your clinical screening to activate donor status & save lives."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              <Home className="h-3.5 w-3.5" /> Skip to Dashboard
            </Link>
          </div>
        </div>

        {/* Stepper Progress Bar */}
        <div className="rounded-2xl border border-border/70 bg-card/90 p-5 shadow-xs backdrop-blur-md">
          {/* Progress Percent Bar */}
          <div className="mb-4 flex items-center justify-between text-xs font-semibold">
            <span className="text-muted-foreground">
              Step {currentStep} of {totalSteps}:{" "}
              <span className="text-foreground">{stepsMetadata[currentStep - 1].title}</span>
            </span>
            <span className="text-primary font-bold">
              {Math.round(((currentStep - 1) / (totalSteps - 1)) * 100)}% Completed
            </span>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{
                width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
              }}
            />
          </div>

          {/* Stepper Dots (Desktop) */}
          <div className="mt-5 hidden grid-cols-6 gap-2 sm:grid">
            {stepsMetadata.map((s) => {
              const isDone = currentStep > s.num;
              const isCurrent = currentStep === s.num;
              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => s.num < currentStep && jumpToStep(s.num)}
                  disabled={s.num > currentStep}
                  className={`flex items-center gap-2 rounded-lg p-2 text-left transition-colors ${
                    isCurrent
                      ? "bg-primary/10 text-primary ring-1 ring-primary/40"
                      : isDone
                      ? "text-foreground hover:bg-muted cursor-pointer"
                      : "text-muted-foreground/60 cursor-not-allowed"
                  }`}
                >
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isCurrent
                        ? "bg-primary text-primary-foreground"
                        : isDone
                        ? "bg-emerald-500 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="h-4 w-4" /> : s.num}
                  </div>
                  <div className="min-w-0 flex-1 truncate">
                    <p className="truncate text-xs font-medium">{s.title}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Form Body */}
        <form onSubmit={handleSubmit(() => {})}>
          {/* STEP 1: Personal & Identity Details */}
          {currentStep === 1 && (
            <Card className="animate-fade-up border-border/80 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Personal &amp; Contact Details</CardTitle>
                    <CardDescription>
                      Basic demographic and address information needed for blood bank records.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-2">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Date of Birth */}
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Date of Birth * (Must be 18–65)
                    </Label>
                    <div className="relative">
                      <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="dateOfBirth"
                        type="date"
                        className="pl-10"
                        {...register("dateOfBirth", { required: "Birth date is required" })}
                      />
                    </div>
                    {formValues.dateOfBirth && (
                      <p className="text-xs text-muted-foreground">
                        Calculated Age:{" "}
                        <span className="font-semibold text-foreground">
                          {calculateAge(formValues.dateOfBirth)} years
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Gender */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Gender *
                    </Label>
                    <Controller
                      name="gender"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MALE">Male</SelectItem>
                            <SelectItem value="FEMALE">Female</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                            <SelectItem value="PREFER_NOT_TO_SAY">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Phone Number *
                    </Label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="phoneNumber"
                        type="tel"
                        placeholder="e.g. 9876543210"
                        className="pl-10"
                        {...register("phoneNumber", {
                          required: "Phone number is required",
                          minLength: { value: 10, message: "Enter at least 10 digits" },
                        })}
                      />
                    </div>
                  </div>

                  {/* Marital Status */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Marital Status
                    </Label>
                    <Controller
                      name="maritalStatus"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select marital status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SINGLE">Single</SelectItem>
                            <SelectItem value="MARRIED">Married</SelectItem>
                            <SelectItem value="DIVORCED">Divorced</SelectItem>
                            <SelectItem value="WIDOWED">Widowed</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                  <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                    <MapPin className="h-4 w-4 text-primary" /> Residential Address &amp; Location
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="addressLine" className="text-xs text-muted-foreground">
                        Street Address / Landmark
                      </Label>
                      <Input
                        id="addressLine"
                        placeholder="e.g. Flat 402, Green Meadows, 5th Main Rd"
                        {...register("addressLine")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-xs text-muted-foreground">
                        City *
                      </Label>
                      <Input
                        id="city"
                        placeholder="e.g. Chennai"
                        {...register("city", { required: "City is required" })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="district" className="text-xs text-muted-foreground">
                        District
                      </Label>
                      <Input
                        id="district"
                        placeholder="e.g. Chennai Central"
                        {...register("district")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state" className="text-xs text-muted-foreground">
                        State *
                      </Label>
                      <Input
                        id="state"
                        placeholder="e.g. Tamil Nadu"
                        {...register("state", { required: "State is required" })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pincode" className="text-xs text-muted-foreground">
                        Pincode *
                      </Label>
                      <Input
                        id="pincode"
                        placeholder="e.g. 600001"
                        {...register("pincode", {
                          required: "Pincode is required",
                          minLength: { value: 6, message: "Enter 6 digit pincode" },
                        })}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 2: Physical & Blood Profile */}
          {currentStep === 2 && (
            <Card className="animate-fade-up border-border/80 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Droplet className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Blood Group &amp; Physical Parameters</CardTitle>
                    <CardDescription>
                      Crucial criteria to assess donor volume capacity and whole blood compatibility.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-2">
                {/* Blood Group Selector */}
                <div className="space-y-3">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Select Your Blood Group *
                  </Label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {BLOOD_GROUPS.map((bg) => {
                      const isSelected = formValues.bloodGroup === bg.value;
                      return (
                        <button
                          key={bg.value}
                          type="button"
                          onClick={() => setValue("bloodGroup", bg.value)}
                          className={`relative flex flex-col items-center justify-center rounded-xl border p-4 text-center transition-all ${
                            isSelected
                              ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/40 shadow-xs"
                              : "border-border/80 bg-card hover:border-primary/40 hover:bg-muted/40"
                          }`}
                        >
                          <span className="font-display text-2xl font-black">{bg.label}</span>
                          <span className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">
                            {bg.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Height & Weight */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="heightCm" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Height (in cm) *
                    </Label>
                    <div className="relative">
                      <Scale className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="heightCm"
                        type="number"
                        min={120}
                        max={230}
                        className="pl-10 font-medium"
                        {...register("heightCm", { required: true, valueAsNumber: true })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="weightKg" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Weight (in kg) *
                      </Label>
                      <span className="text-xs font-semibold text-primary">Minimum: 50 kg</span>
                    </div>
                    <div className="relative">
                      <Scale className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="weightKg"
                        type="number"
                        min={30}
                        max={200}
                        className={`pl-10 font-medium ${
                          formValues.weightKg < 50
                            ? "border-destructive text-destructive focus-visible:ring-destructive"
                            : ""
                        }`}
                        {...register("weightKg", { required: true, valueAsNumber: true })}
                      />
                    </div>
                    {formValues.weightKg < 50 && (
                      <p className="flex items-center gap-1 text-xs text-destructive">
                        <AlertTriangle className="h-3 w-3" /> Donors weighing under 50 kg are ineligible to prevent fainting and hypovolemia.
                      </p>
                    )}
                  </div>
                </div>

                {/* Donation History */}
                <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">Have you donated blood before?</h4>
                      <p className="text-xs text-muted-foreground">Prior donation history helps track safety intervals.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={formValues.donatedBefore ? "default" : "outline"}
                        onClick={() => setValue("donatedBefore", true)}
                      >
                        Yes
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={!formValues.donatedBefore ? "default" : "outline"}
                        onClick={() => setValue("donatedBefore", false)}
                      >
                        No
                      </Button>
                    </div>
                  </div>

                  {formValues.donatedBefore && (
                    <div className="grid grid-cols-1 gap-4 pt-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="previousDonationCount" className="text-xs text-muted-foreground">
                          Previous Donation Count
                        </Label>
                        <Input
                          id="previousDonationCount"
                          type="number"
                          min={1}
                          max={100}
                          {...register("previousDonationCount", { valueAsNumber: true })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lastDonationDate" className="text-xs text-muted-foreground">
                          Date of Last Donation (Must be &gt;90 days ago)
                        </Label>
                        <Input
                          id="lastDonationDate"
                          type="date"
                          {...register("lastDonationDate")}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 3: Health History & Medical Screening */}
          {currentStep === 3 && (
            <Card className="animate-fade-up border-border/80 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Health History &amp; Medical Screening</CardTitle>
                    <CardDescription>
                      Honest reporting protects both your physiological health and vulnerable transfusion recipients.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-2">
                {/* 1. Serious Chronic Illness */}
                <div className="flex flex-col justify-between gap-3 rounded-xl border border-border/70 p-4 sm:flex-row sm:items-center">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      Do you have any serious chronic medical conditions?
                    </p>
                    <p className="text-xs text-muted-foreground">
                      E.g., Heart disease, cancer, chronic kidney failure, epilepsy, hepatitis B/C, or bleeding disorders.
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={formValues.hasSeriousMedicalCondition ? "destructive" : "outline"}
                      onClick={() => setValue("hasSeriousMedicalCondition", true)}
                    >
                      Yes
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={!formValues.hasSeriousMedicalCondition ? "default" : "outline"}
                      onClick={() => setValue("hasSeriousMedicalCondition", false)}
                    >
                      No
                    </Button>
                  </div>
                </div>
                {formValues.hasSeriousMedicalCondition && (
                  <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                    <Label htmlFor="medicalConditionDetails" className="text-xs font-semibold text-destructive">
                      Please specify condition details:
                    </Label>
                    <Input
                      id="medicalConditionDetails"
                      placeholder="e.g. Heart murmur, Asthma on inhalers"
                      {...register("medicalConditionDetails")}
                    />
                  </div>
                )}

                {/* 2. Diabetes */}
                <div className="flex flex-col justify-between gap-3 rounded-xl border border-border/70 p-4 sm:flex-row sm:items-center">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      Do you have a diagnosis of Diabetes?
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Controlled diabetes without insulin is eligible. Insulin-dependent diabetes is deferred.
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={formValues.hasDiabetes ? "default" : "outline"}
                      onClick={() => setValue("hasDiabetes", true)}
                    >
                      Yes
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={!formValues.hasDiabetes ? "default" : "outline"}
                      onClick={() => {
                        setValue("hasDiabetes", false);
                        setValue("diabetesLevel", "NONE");
                      }}
                    >
                      No
                    </Button>
                  </div>
                </div>
                {formValues.hasDiabetes && (
                  <div className="space-y-2 rounded-lg border border-border/70 bg-muted/30 p-3">
                    <Label className="text-xs font-semibold text-foreground">
                      Diabetes Treatment Method:
                    </Label>
                    <Controller
                      name="diabetesLevel"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select medication type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CONTROLLED_DIET">Controlled by Diet &amp; Exercise (Eligible)</SelectItem>
                            <SelectItem value="ORAL_MEDICATION">Controlled with Oral Pills (Metformin etc.) (Eligible)</SelectItem>
                            <SelectItem value="INSULIN">Insulin Injections (Deferred for safety)</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                )}

                {/* 3. Tattoos or Piercings */}
                <div className="flex flex-col justify-between gap-3 rounded-xl border border-border/70 p-4 sm:flex-row sm:items-center">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      Have you received a tattoo or body piercing recently?
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Tattoos or piercings within the past 6 months require a temporary deferral period.
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={formValues.hasTattoo ? "default" : "outline"}
                      onClick={() => setValue("hasTattoo", true)}
                    >
                      Yes
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={!formValues.hasTattoo ? "default" : "outline"}
                      onClick={() => setValue("hasTattoo", false)}
                    >
                      No
                    </Button>
                  </div>
                </div>
                {formValues.hasTattoo && (
                  <div className="space-y-2 rounded-lg border border-border/70 bg-muted/30 p-3">
                    <Label htmlFor="tattooDate" className="text-xs font-semibold text-foreground">
                      Date Tattoo/Piercing was performed:
                    </Label>
                    <Input
                      id="tattooDate"
                      type="date"
                      {...register("tattooDate")}
                    />
                  </div>
                )}

                {/* 4. Surgeries */}
                <div className="flex flex-col justify-between gap-3 rounded-xl border border-border/70 p-4 sm:flex-row sm:items-center">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      Have you undergone major or minor surgery?
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Requires at least 6 months recovery time after major procedures.
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={formValues.hasHadSurgery ? "default" : "outline"}
                      onClick={() => setValue("hasHadSurgery", true)}
                    >
                      Yes
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={!formValues.hasHadSurgery ? "default" : "outline"}
                      onClick={() => setValue("hasHadSurgery", false)}
                    >
                      No
                    </Button>
                  </div>
                </div>
                {formValues.hasHadSurgery && (
                  <div className="space-y-2 rounded-lg border border-border/70 bg-muted/30 p-3">
                    <Label htmlFor="lastSurgeryDate" className="text-xs font-semibold text-foreground">
                      Date of last surgery:
                    </Label>
                    <Input
                      id="lastSurgeryDate"
                      type="date"
                      {...register("lastSurgeryDate")}
                    />
                  </div>
                )}

                {/* 5. Prescription Medications */}
                <div className="flex flex-col justify-between gap-3 rounded-xl border border-border/70 p-4 sm:flex-row sm:items-center">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      Are you currently taking any prescription medications?
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Antibiotics, blood thinners (aspirin/warfarin), or immunosuppressants.
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={formValues.takesMedication ? "default" : "outline"}
                      onClick={() => setValue("takesMedication", true)}
                    >
                      Yes
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={!formValues.takesMedication ? "default" : "outline"}
                      onClick={() => setValue("takesMedication", false)}
                    >
                      No
                    </Button>
                  </div>
                </div>
                {formValues.takesMedication && (
                  <div className="space-y-2 rounded-lg border border-border/70 bg-muted/30 p-3">
                    <Label htmlFor="medicationDetails" className="text-xs font-semibold text-foreground">
                      Specify Medication Names:
                    </Label>
                    <Input
                      id="medicationDetails"
                      placeholder="e.g. Amoxicillin, Antihypertensives"
                      {...register("medicationDetails")}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* STEP 4: Gender Screening (Schema Clinical Rules) */}
          {currentStep === 4 && (
            <Card className="animate-fade-up border-border/80 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Heart className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Gender Screening &amp; Clinical Safety</CardTitle>
                    <CardDescription>
                      Tailored screening questions corresponding to physiological criteria in the clinical schema.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-2">
                {formValues.gender === "FEMALE" ? (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                      <div className="flex items-start gap-3">
                        <Info className="mt-0.5 h-5 w-5 text-primary shrink-0" />
                        <div className="text-xs text-muted-foreground">
                          <p className="font-semibold text-foreground">Maternal Health Protocol:</p>
                          Indian National Blood Transfusion Council regulations require temporary deferral during pregnancy and lactation to prevent postpartum iron depletion.
                        </div>
                      </div>
                    </div>

                    {/* Question 1: Currently Pregnant */}
                    <div className="flex flex-col justify-between gap-3 rounded-xl border border-border/70 p-4 sm:flex-row sm:items-center">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">
                          Are you currently pregnant?
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Donation during pregnancy is deferred to safeguard maternal &amp; fetal health.
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={formValues.currentlyPregnant ? "destructive" : "outline"}
                          onClick={() => setValue("currentlyPregnant", true)}
                        >
                          Yes
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={!formValues.currentlyPregnant ? "default" : "outline"}
                          onClick={() => setValue("currentlyPregnant", false)}
                        >
                          No
                        </Button>
                      </div>
                    </div>

                    {/* Question 2: Recent Pregnancy, Delivery, or Lactation */}
                    <div className="flex flex-col justify-between gap-3 rounded-xl border border-border/70 p-4 sm:flex-row sm:items-center">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">
                          Have you had a delivery or miscarriage within the last 6 months?
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Or are you currently breastfeeding a child under 6 months old?
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={formValues.recentPregnancyOrDelivery ? "default" : "outline"}
                          onClick={() => setValue("recentPregnancyOrDelivery", true)}
                        >
                          Yes
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={!formValues.recentPregnancyOrDelivery ? "default" : "outline"}
                          onClick={() => setValue("recentPregnancyOrDelivery", false)}
                        >
                          No
                        </Button>
                      </div>
                    </div>

                    {formValues.recentPregnancyOrDelivery && (
                      <div className="space-y-2 rounded-lg border border-border/70 bg-muted/30 p-3">
                        <Label htmlFor="lastPregnancyDate" className="text-xs font-semibold text-foreground">
                          Date of delivery or miscarriage:
                        </Label>
                        <Input
                          id="lastPregnancyDate"
                          type="date"
                          {...register("lastPregnancyDate")}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600 shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-foreground">Standard Screening Protocol Active</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Gender recorded: <span className="font-semibold text-foreground">{formValues.gender}</span>. Maternal deferral rules do not apply.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* General Wellness Confirmation */}
                    <div className="rounded-xl border border-border/80 p-4 space-y-3">
                      <h4 className="text-sm font-semibold text-foreground">Pre-Donation Wellness Checklist</h4>
                      <div className="space-y-2 text-xs text-muted-foreground">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" defaultChecked className="rounded border-border" />
                          <span>I am feeling fit, healthy, and free from fever or active viral infections today.</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" defaultChecked className="rounded border-border" />
                          <span>I agree not to consume alcohol for at least 24 hours prior to blood donation.</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" defaultChecked className="rounded border-border" />
                          <span>I have had adequate sleep and intend to drink plenty of fluids prior to donation.</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* STEP 5: Donation Preferences & Availability */}
          {currentStep === 5 && (
            <Card className="animate-fade-up border-border/80 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Compass className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Availability &amp; Travel Preferences</CardTitle>
                    <CardDescription>
                      Configure how and when blood banks and emergency patients can connect with you.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-2">
                {/* Active Availability Switch */}
                <div className="flex flex-col justify-between gap-3 rounded-xl border border-border/70 p-4 sm:flex-row sm:items-center">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      Mark as Active &amp; Available for Donation Requests?
                    </p>
                    <p className="text-xs text-muted-foreground">
                      When enabled, nearby hospitals with compatible blood shortages can request your support.
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={formValues.isAvailable ? "default" : "outline"}
                      onClick={() => setValue("isAvailable", true)}
                    >
                      Available
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={!formValues.isAvailable ? "destructive" : "outline"}
                      onClick={() => setValue("isAvailable", false)}
                    >
                      Unavailable
                    </Button>
                  </div>
                </div>

                {/* Travel Preference */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Travel Preference
                    </Label>
                    <Controller
                      name="travelPreference"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select travel preference" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NEARBY">Nearby Hospitals Only</SelectItem>
                            <SelectItem value="ANYWHERE">Anywhere in my District / State</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxTravelDistanceKm" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Max Travel Distance (in km)
                    </Label>
                    <Input
                      id="maxTravelDistanceKm"
                      type="number"
                      min={5}
                      max={200}
                      {...register("maxTravelDistanceKm", { valueAsNumber: true })}
                    />
                  </div>
                </div>

                {/* Contact Preference */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Preferred Communication Channel
                  </Label>
                  <Controller
                    name="contactPreference"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select contact preference" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PHONE">Phone Call / SMS Only</SelectItem>
                          <SelectItem value="EMAIL">Email Notifications Only</SelectItem>
                          <SelectItem value="BOTH">Both Phone and Email Alerts</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 6: Health Assessment & Eligibility Screen */}
          {currentStep === 6 && (
            <div className="animate-fade-up space-y-6">
              {evaluation.isEligible ? (
                /* ================= SUCCESS / ELIGIBLE SCREEN ================= */
                <Card className="border-emerald-500/40 bg-card shadow-md">
                  <CardContent className="p-6 sm:p-8 space-y-6">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 ring-8 ring-emerald-500/5">
                        <CheckCircle2 className="h-8 w-8" />
                      </div>
                      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
                        Clinical Screening Passed
                      </Badge>
                      <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                        You Are Fully Eligible to Donate Blood!
                      </h2>
                      <p className="max-w-xl text-sm text-muted-foreground">
                        Your health assessment meets Indian Red Cross &amp; WHO blood donation standards. Your profile is ready to join the life-saving donor registry.
                      </p>
                    </div>

                    {/* Donor Quick Card Preview */}
                    <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border/80 bg-muted/30 p-5 sm:grid-cols-4">
                      <div className="text-center">
                        <p className="text-[11px] font-semibold uppercase text-muted-foreground">Blood Type</p>
                        <p className="mt-1 font-display text-2xl font-black text-primary">
                          {BLOOD_GROUPS.find((b) => b.value === formValues.bloodGroup)?.label}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[11px] font-semibold uppercase text-muted-foreground">Weight / BMI</p>
                        <p className="mt-1 font-display text-xl font-bold text-foreground">
                          {formValues.weightKg} kg <span className="text-xs font-normal text-muted-foreground">({evaluation.bmi} BMI)</span>
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[11px] font-semibold uppercase text-muted-foreground">Age</p>
                        <p className="mt-1 font-display text-xl font-bold text-foreground">
                          {evaluation.age} yrs
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[11px] font-semibold uppercase text-muted-foreground">Status</p>
                        <p className="mt-1 font-display text-base font-bold text-emerald-600 dark:text-emerald-400">
                          Ready &amp; Active
                        </p>
                      </div>
                    </div>

                    {/* Summary Review details */}
                    <div className="rounded-xl border border-border/70 p-4 text-xs space-y-2">
                      <div className="flex justify-between border-b border-border/50 pb-2">
                        <span className="text-muted-foreground">Location:</span>
                        <span className="font-semibold">{formValues.city}, {formValues.state}</span>
                      </div>
                      <div className="flex justify-between border-b border-border/50 pb-2">
                        <span className="text-muted-foreground">Contact:</span>
                        <span className="font-semibold">{formValues.phoneNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Max Travel Range:</span>
                        <span className="font-semibold">{formValues.maxTravelDistanceKm} km ({formValues.travelPreference})</span>
                      </div>
                    </div>

                    {/* Confirmation Button */}
                    <div className="pt-2 flex flex-col gap-3 sm:flex-row sm:justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => jumpToStep(1)}
                        disabled={saveMutation.isPending}
                      >
                        Edit Details
                      </Button>
                      <Button
                        type="button"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 h-11"
                        disabled={saveMutation.isPending}
                        onClick={() => saveMutation.mutate(true)}
                      >
                        {saveMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {isUpdateMode ? "Updating Health Profile..." : "Saving Donor Profile..."}
                          </>
                        ) : (
                          <>
                            {isUpdateMode ? "Update Health Profile" : "Complete Onboarding & Go to Dashboard"} <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                /* ================= INELIGIBLE SCREEN ================= */
                <Card className="border-destructive/40 bg-card shadow-md">
                  <CardContent className="p-6 sm:p-8 space-y-6">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive ring-8 ring-destructive/5">
                        <ShieldAlert className="h-8 w-8" />
                      </div>
                      <Badge variant="destructive" className="font-semibold">
                        Health Deferral Notice
                      </Badge>
                      <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                        You Are Currently Not Eligible to Donate Blood
                      </h2>
                      <p className="max-w-xl text-sm text-muted-foreground">
                        We deeply appreciate your compassion and willingness to donate blood. However, based on safety regulations, you cannot donate at this time for the reasons outlined below:
                      </p>
                    </div>

                    {/* Specific Reasons List */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Specific Health Assessment Findings ({evaluation.reasons.length}):
                      </h3>
                      <div className="divide-y divide-border/60 rounded-xl border border-destructive/20 bg-destructive/5">
                        {evaluation.reasons.map((r, idx) => (
                          <div key={idx} className="p-4 space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-2.5">
                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                                <div>
                                  <p className="text-sm font-bold text-foreground">{r.title}</p>
                                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                                    {r.description}
                                  </p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs border-border shrink-0"
                                onClick={() => jumpToStep(r.stepToEdit)}
                              >
                                Edit Step {r.stepToEdit}
                              </Button>
                            </div>

                            {r.eligibleAfter && (
                              <div className="ml-7 flex items-center gap-2 text-xs font-semibold text-primary">
                                <Clock className="h-3.5 w-3.5" />
                                <span>Estimated Date Eligible: {r.eligibleAfter}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Informative Guidance */}
                    <div className="rounded-xl border border-border/70 bg-muted/30 p-4 text-xs text-muted-foreground space-y-1.5">
                      <p className="font-semibold text-foreground flex items-center gap-1.5">
                        <Info className="h-4 w-4 text-primary" /> What happens next?
                      </p>
                      <p>
                        • If any answer was a typo (e.g. wrong year or weight), click <strong>Back to Review Details</strong> to adjust your entry.
                      </p>
                      <p>
                        • If this is a temporary deferral (e.g. tattoo or weight recovery), your profile will be saved in non-active status, and you can re-apply once the duration passes.
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-between pt-2">
                      <Button
                        type="button"
                        variant="default"
                        className="h-11 px-6 font-semibold"
                        onClick={() => jumpToStep(evaluation.reasons[0]?.stepToEdit || 1)}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Review Details
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 px-6"
                        disabled={saveMutation.isPending}
                        onClick={() => saveMutation.mutate(false)}
                      >
                        {saveMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {isUpdateMode ? "Updating..." : "Saving..."}
                          </>
                        ) : (
                          isUpdateMode ? "Update Profile as Deferred" : "Save Profile as Deferred & Go to Dashboard"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Stepper Navigation Footer Buttons */}
          {currentStep < totalSteps && (
            <div className="mt-6 flex items-center justify-between rounded-xl border border-border/70 bg-card/90 p-4 backdrop-blur-md">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                disabled={currentStep === 1}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" /> Previous
              </Button>

              <div className="text-xs text-muted-foreground hidden sm:block">
                All details stored securely adhering to medical privacy guidelines.
              </div>

              <Button
                type="button"
                onClick={handleNextStep}
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6"
              >
                {currentStep === totalSteps - 1
                  ? (isUpdateMode ? "Review & Update Health" : "Evaluate Health & Screen")
                  : "Next Step"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
