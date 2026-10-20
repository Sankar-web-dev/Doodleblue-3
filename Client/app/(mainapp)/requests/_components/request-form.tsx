"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Eye,
  Loader2,
  Megaphone,
  Save,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

import {
  profilesApi,
  PROFILES_BLOOD_BANK_KEY,
  PROFILES_PERSONAL_KEY,
  PROFILES_RECIPIENT_KEY,
} from "@/api/profiles.api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, FieldError } from "@/components/ui/input";
import { DatePicker, todayDateValue } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthUser } from "@/lib/use-auth-user";
import { AddressMapPicker } from "@/components/location/address-map-picker";

import {
  BLOOD_GROUP_OPTIONS,
  BLOOD_REQUEST_FORM_DEFAULTS,
  bloodRequestFormSchema,
  COMPONENT_OPTIONS,
  posterDataFromValues,
  toRequestInput,
  URGENCY_OPTIONS,
  type BloodRequestFormValues,
} from "../_lib/request-form";
import { useCreateRequest, useUpdateRequest } from "../_hooks/use-requests";
import { RequestPreviewDialog } from "./request-preview-dialog";

const TEXTAREA_CLASSES =
  "flex min-h-24 w-full rounded-lg border border-input bg-card px-3 py-2 text-base shadow-2xs transition-all placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

interface RequestFormProps {
  mode: "create" | "edit";
  requestId?: string;
  defaultValues?: BloodRequestFormValues;
}

export function RequestForm({
  mode,
  requestId,
  defaultValues,
}: RequestFormProps) {
  const router = useRouter();
  const { user } = useAuthUser();
  const [previewOpen, setPreviewOpen] = useState(false);

  const roleLower = (user?.role || "").toLowerCase();
  const isRecipient = roleLower.includes("recip");
  const isBloodBank = roleLower.includes("bank");
  const isAdmin = user?.role === "SUPER_ADMIN";

  const form = useForm<BloodRequestFormValues>({
    resolver: zodResolver(bloodRequestFormSchema),
    mode: "onChange",
    defaultValues:
      defaultValues ?? {
        ...BLOOD_REQUEST_FORM_DEFAULTS,
        requestType: isRecipient ? "RECIPIENT" : isBloodBank ? "BLOOD_BANK" : "RECIPIENT",
      },
  });
  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    trigger,
    formState: { errors },
  } = form;

  const watchedRequestType = useWatch({ control, name: "requestType" });
  const watchHospitalAddress = useWatch({ control, name: "hospitalAddress" });
  const watchLatitude = useWatch({ control, name: "latitude" });
  const watchLongitude = useWatch({ control, name: "longitude" });
  const currentRequestType = watchedRequestType || (isRecipient ? "RECIPIENT" : "BLOOD_BANK");

  // Blood bank profile (for bank accounts)
  const { data: bankProfile } = useQuery({
    queryKey: PROFILES_BLOOD_BANK_KEY,
    queryFn: () => profilesApi.getBloodBankProfile().then((res) => res.profile),
    enabled: isBloodBank || isAdmin,
  });

  // Recipient profiles (for recipient accounts)
  const { data: recipientProfile } = useQuery({
    queryKey: PROFILES_RECIPIENT_KEY,
    queryFn: () => profilesApi.getRecipientProfile().then((res) => res.profile),
    enabled: isRecipient || isAdmin,
  });

  const { data: personalProfile } = useQuery({
    queryKey: PROFILES_PERSONAL_KEY,
    queryFn: () => profilesApi.getPersonalProfile().then((res) => res.profile),
    enabled: isRecipient || isAdmin,
  });

  // Prefill details from profile on first load (create mode only)
  useEffect(() => {
    if (mode !== "create") return;
    const dirty = form.formState.dirtyFields;
    const prefill = (field: keyof BloodRequestFormValues, value?: string | number | null) => {
      if (value === undefined || value === null || value === "" || dirty[field]) return;
      if (!getValues(field)) {
        setValue(field, value as never, { shouldDirty: false });
      }
    };

    if (isRecipient) {
      prefill("requestType", "RECIPIENT");
      if (recipientProfile?.registrationFor === "SELF") {
        prefill("patientName", user?.name);
        prefill("relationshipToPatient", "Self");
      } else if (recipientProfile?.registrationFor === "SOMEONE_ELSE") {
        prefill("relationshipToPatient", recipientProfile?.relationshipToPatient);
      }
      prefill("contactName", user?.name);
      prefill("contactPhone", personalProfile?.phoneNumber);
      prefill("hospitalAddress", personalProfile?.addressLine);
      prefill("city", personalProfile?.city);
      prefill("district", personalProfile?.district);
      prefill("state", personalProfile?.state);
      prefill("pincode", personalProfile?.pincode);
    } else if (isBloodBank && bankProfile) {
      prefill("requestType", "BLOOD_BANK");
      prefill("hospitalName", bankProfile.institutionName);
      prefill("city", bankProfile.city);
      prefill("district", bankProfile.district);
      prefill("state", bankProfile.state);
      prefill("pincode", bankProfile.pincode);
      prefill("contactName", bankProfile.contactPersonName);
      prefill("contactPhone", bankProfile.contactPhone);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bankProfile, recipientProfile, personalProfile, user, isRecipient, isBloodBank, mode]);

  const goBack = () => router.push("/requests");

  const createMutation = useCreateRequest(() => {
    toast.success("Request published", {
      description: isRecipient
        ? "Your blood appeal has been submitted and nearby donors are being notified."
        : "Your blood appeal is now visible to donors.",
    });
    router.push("/requests");
  });

  const updateMutation = useUpdateRequest(requestId ?? "", () => {
    toast.success("Request updated", {
      description: "Changes to your blood request have been saved.",
    });
    router.push("/requests");
  });

  const activeMutation = mode === "create" ? createMutation : updateMutation;

  const onSubmit = (values: BloodRequestFormValues) => {
    const resolvedType = isRecipient
      ? "RECIPIENT"
      : isBloodBank
      ? "BLOOD_BANK"
      : values.requestType || "RECIPIENT";

    const input = toRequestInput({
      ...values,
      requestType: resolvedType,
    });

    activeMutation.mutate(input, {
      onError: (err) =>
        toast.error(
          mode === "create" ? "Failed to publish request" : "Update failed",
          {
            description:
              err instanceof Error ? err.message : "Please try again.",
          }
        ),
    });
  };

  const handlePreview = async () => {
    const valid = await trigger();
    if (valid) {
      setPreviewOpen(true);
    } else {
      toast.error("Fix the highlighted fields", {
        description: "A few required details are missing before preview.",
      });
    }
  };

  const handleConfirm = () => {
    setPreviewOpen(false);
    handleSubmit(onSubmit)();
  };

  const err = (name: keyof BloodRequestFormValues) => errors[name]?.message;

  const isCurrentRecipientRequest = currentRequestType === "RECIPIENT";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight">
              {mode === "create"
                ? isRecipient
                  ? "Request Blood"
                  : "New Blood Request"
                : "Edit Blood Request"}
            </h1>
            <Badge
              variant="outline"
              className={
                isCurrentRecipientRequest
                  ? "border-rose-300 bg-rose-50 text-rose-700"
                  : "border-blue-300 bg-blue-50 text-blue-700"
              }
            >
              {isCurrentRecipientRequest ? "Recipient Appeal" : "Blood Bank Requirement"}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "create"
              ? isRecipient
                ? "Submit an urgent blood request for yourself or a loved one. Eligible donors in your city will be alerted immediately."
                : "Fill in the requirement details and preview the appeal before publishing."
              : "Update the request details, then save your changes."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={goBack}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handlePreview}
            className="gap-2 border-primary/40 text-primary hover:bg-primary/5"
          >
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          <Button type="submit" disabled={activeMutation.isPending} className="gap-2">
            {activeMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : mode === "create" ? (
              <Megaphone className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {mode === "create"
              ? isRecipient
                ? "Publish Appeal"
                : "Publish Request"
              : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Admin Request Type Toggle (Only if Super Admin) */}
      {isAdmin && (
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Request Classification</CardTitle>
            <CardDescription>
              Select whether this request represents an individual recipient appeal or a blood bank facility requirement.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Request Type *
              </Label>
              <Controller
                control={control}
                name="requestType"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RECIPIENT">Recipient (Patient / Individual)</SelectItem>
                      <SelectItem value="BLOOD_BANK">Blood Bank / Hospital</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Requirement Details */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Requirement Details</CardTitle>
          <CardDescription>Specify the blood group, component, and urgency required.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Blood Group *
            </Label>
            <Controller
              control={control}
              name="bloodGroup"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent>
                    {BLOOD_GROUP_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError message={err("bloodGroup")} />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Component *
            </Label>
            <Controller
              control={control}
              name="component"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPONENT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError message={err("component")} />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="unitsRequired"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Units Required *
            </Label>
            <Input
              id="unitsRequired"
              type="number"
              min={1}
              max={50}
              {...register("unitsRequired", { valueAsNumber: true })}
            />
            <FieldError message={err("unitsRequired")} />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Urgency *
            </Label>
            <Controller
              control={control}
              name="urgency"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {URGENCY_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError message={err("urgency")} />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="requiredBy"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Required By
            </Label>
            <Controller
              name="requiredBy"
              control={control}
              render={({ field }) => (
                <DatePicker
                  id="requiredBy"
                  value={field.value}
                  onChange={field.onChange}
                  minDate={todayDateValue()}
                  placeholder="Select required-by date"
                />
              )}
            />
            <FieldError message={err("requiredBy")} />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="expiresAt"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Request Expires On
            </Label>
            <Controller
              name="expiresAt"
              control={control}
              render={({ field }) => (
                <DatePicker
                  id="expiresAt"
                  value={field.value}
                  onChange={field.onChange}
                  minDate={todayDateValue()}
                  placeholder="Select expiry date"
                />
              )}
            />
            <FieldError message={err("expiresAt")} />
          </div>
        </CardContent>
      </Card>

      {/* Patient Context (Prominent for Recipient, Optional for Blood Bank) */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Patient Details{" "}
              {!isCurrentRecipientRequest && (
                <span className="text-xs font-normal text-muted-foreground">
                  (optional — only if this request is for a specific patient)
                </span>
              )}
            </CardTitle>
            {isCurrentRecipientRequest && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <UserCheck className="h-3 w-3 text-primary" /> Recipient Context
              </Badge>
            )}
          </div>
          <CardDescription>
            {isCurrentRecipientRequest
              ? "Provide the patient's name and relationship to help donors confirm the recipient context."
              : "Optional context if this blood requirement is earmarked for an admitted patient."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="space-y-2">
            <Label
              htmlFor="patientName"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Patient Name {isCurrentRecipientRequest ? "*" : ""}
            </Label>
            <Input
              id="patientName"
              placeholder={isCurrentRecipientRequest ? "Patient's full name" : "Optional patient name"}
              {...register("patientName")}
            />
            <FieldError message={err("patientName")} />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="patientAge"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Patient Age
            </Label>
            <Input
              id="patientAge"
              type="number"
              placeholder="e.g. 42"
              min={0}
              max={120}
              {...register("patientAge", {
                setValueAs: (v) =>
                  v === "" || v == null || Number.isNaN(Number(v))
                    ? undefined
                    : Number(v),
              })}
            />
            <FieldError message={err("patientAge")} />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="relationshipToPatient"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Relationship to Patient
            </Label>
            <Input
              id="relationshipToPatient"
              placeholder={isCurrentRecipientRequest ? "e.g. Self, Father, Daughter" : "e.g. Father, Hospital staff"}
              {...register("relationshipToPatient")}
            />
            <FieldError message={err("relationshipToPatient")} />
          </div>
          <div className="space-y-2 sm:col-span-3">
            <Label
              htmlFor="reason"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Reason for Request / Condition
            </Label>
            <Input
              id="reason"
              placeholder="e.g., Lung surgery, orthopedic operation, accident trauma"
              {...register("reason")}
            />
            <FieldError message={err("reason")} />
            <p className="text-xs text-muted-foreground">
              Specify the surgery or medical condition requiring blood (e.g., lung surgery, leg fracture operation, urgent medical procedure).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Venue & Location */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {isCurrentRecipientRequest ? "Hospital & Treatment Facility" : "Venue & Location"}
          </CardTitle>
          <CardDescription>
            {isCurrentRecipientRequest
              ? "Specify the hospital or medical center where the patient is admitted and where blood should be delivered."
              : "Street address and city where donors should report for collection."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2 sm:col-span-2 lg:col-span-2">
            <Label
              htmlFor="hospitalName"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Hospital / Venue Name {isCurrentRecipientRequest ? "*" : ""}
            </Label>
            <Input
              id="hospitalName"
              placeholder={isCurrentRecipientRequest ? "e.g. Apollo Hospital, Ward 4B, ICU" : "Where donors should report"}
              {...register("hospitalName")}
            />
            <FieldError message={err("hospitalName")} />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="pincode"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Pincode
            </Label>
            <Input id="pincode" placeholder="6-digit pincode" {...register("pincode")} />
            <FieldError message={err("pincode")} />
          </div>
          <div className="space-y-2 sm:col-span-2 lg:col-span-3">
            <Label
              htmlFor="hospitalAddress"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between"
            >
              <span>Address &amp; Location on Map</span>
            </Label>
            <AddressMapPicker
              id="hospitalAddress"
              placeholder="Search hospital or delivery address on map…"
              value={watchHospitalAddress ?? ""}
              latitude={watchLatitude}
              longitude={watchLongitude}
              onChangeAddress={(val) =>
                setValue("hospitalAddress", val, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              onLocationSelect={(data) => {
                if (data.addressLine)
                  setValue("hospitalAddress", data.addressLine, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                if (data.city)
                  setValue("city", data.city, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                if (data.district)
                  setValue("district", data.district, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                if (data.state)
                  setValue("state", data.state, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                if (data.pincode)
                  setValue("pincode", data.pincode, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                setValue("latitude", data.latitude, { shouldDirty: true });
                setValue("longitude", data.longitude, { shouldDirty: true });
              }}
            />
            <FieldError message={err("hospitalAddress")} />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="city"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              City *
            </Label>
            <Input id="city" placeholder="e.g. Chennai" {...register("city")} />
            <FieldError message={err("city")} />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="district"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              District
            </Label>
            <Input id="district" placeholder="District name" {...register("district")} />
            <FieldError message={err("district")} />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="state"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              State *
            </Label>
            <Input id="state" placeholder="e.g. Tamil Nadu" {...register("state")} />
            <FieldError message={err("state")} />
          </div>
        </CardContent>
      </Card>

      {/* Contact & Notes */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Point of Contact &amp; Additional Notes</CardTitle>
          <CardDescription>
            Who donors or blood bank staff can coordinate with regarding this request.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label
              htmlFor="contactName"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Contact Person
            </Label>
            <Input
              id="contactName"
              placeholder="Who donors should ask for or contact"
              {...register("contactName")}
            />
            <FieldError message={err("contactName")} />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="contactPhone"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Contact Phone
            </Label>
            <Input
              id="contactPhone"
              placeholder="10-digit phone number"
              {...register("contactPhone")}
            />
            <FieldError message={err("contactPhone")} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label
              htmlFor="notes"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Additional Notes
            </Label>
            <textarea
              id="notes"
              className={TEXTAREA_CLASSES}
              placeholder={
                isCurrentRecipientRequest
                  ? "Doctor in charge, Patient Registration ID, required documents, or blood cross-matching instructions…"
                  : "Anything donors should know — documents to carry, parking, camp timings…"
              }
              {...register("notes")}
            />
            <FieldError message={err("notes")} />
          </div>
        </CardContent>
      </Card>

      {/* Poster preview */}
      <RequestPreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        data={posterDataFromValues(
          getValues(),
          bankProfile?.institutionName,
          isCurrentRecipientRequest ? (user?.name || getValues().patientName) : bankProfile?.institutionName
        )}
        confirmLabel={
          mode === "create"
            ? isCurrentRecipientRequest
              ? "Publish Appeal"
              : "Publish Request"
            : "Save Changes"
        }
        onConfirm={handleConfirm}
        confirmPending={activeMutation.isPending}
      />
    </form>
  );
}
