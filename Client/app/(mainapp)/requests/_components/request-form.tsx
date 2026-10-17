"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Eye,
  Loader2,
  Megaphone,
  Save,
} from "lucide-react";
import { toast } from "sonner";

import { profilesApi, PROFILES_BLOOD_BANK_KEY } from "@/api/profiles.api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, FieldError } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [previewOpen, setPreviewOpen] = useState(false);

  const form = useForm<BloodRequestFormValues>({
    resolver: zodResolver(bloodRequestFormSchema),
    defaultValues: defaultValues ?? BLOOD_REQUEST_FORM_DEFAULTS,
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

  // Blood bank profile — prefills location/contact on create and names the poster.
  const { data: bankProfile } = useQuery({
    queryKey: PROFILES_BLOOD_BANK_KEY,
    queryFn: () =>
      profilesApi.getBloodBankProfile().then((res) => res.profile),
  });

  // Prefill venue/contact from the institution profile on first load (create only).
  useEffect(() => {
    if (mode !== "create" || !bankProfile) return;
    const dirty = form.formState.dirtyFields;
    const prefill = (field: keyof BloodRequestFormValues, value?: string | null) => {
      if (!value || dirty[field]) return;
      if (!getValues(field)) setValue(field, value, { shouldDirty: false });
    };
    prefill("hospitalName", bankProfile.institutionName);
    prefill("city", bankProfile.city);
    prefill("district", bankProfile.district);
    prefill("state", bankProfile.state);
    prefill("pincode", bankProfile.pincode);
    prefill("contactName", bankProfile.contactPersonName);
    prefill("contactPhone", bankProfile.contactPhone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bankProfile, mode]);

  const goBack = () => router.push("/requests");

  const createMutation = useCreateRequest(() => {
    toast.success("Request published", {
      description: "Your blood appeal is now visible to donors.",
    });
    router.push("/requests");
  });

  const updateMutation = useUpdateRequest(requestId ?? "", () => {
    toast.success("Request updated");
    router.push("/requests");
  });

  const activeMutation = mode === "create" ? createMutation : updateMutation;

  const onSubmit = (values: BloodRequestFormValues) => {
    const input = toRequestInput(values);
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {mode === "create" ? "New Blood Request" : "Edit Blood Request"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "create"
              ? "Fill in the requirement details and preview the appeal before publishing."
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
            {mode === "create" ? "Publish Request" : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Requirement */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Requirement Details</CardTitle>
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
              Component
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
            <Input id="requiredBy" type="date" {...register("requiredBy")} />
            <FieldError message={err("requiredBy")} />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="expiresAt"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Request Expires On
            </Label>
            <Input id="expiresAt" type="date" {...register("expiresAt")} />
            <FieldError message={err("expiresAt")} />
          </div>
        </CardContent>
      </Card>

      {/* Patient context (optional) */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Patient Details{" "}
            <span className="text-xs font-normal text-muted-foreground">
              (optional — only if this request is for a specific patient)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="space-y-2">
            <Label
              htmlFor="patientName"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Patient Name
            </Label>
            <Input id="patientName" {...register("patientName")} />
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
              Relationship
            </Label>
            <Input
              id="relationshipToPatient"
              placeholder="e.g. Father, Hospital staff"
              {...register("relationshipToPatient")}
            />
            <FieldError message={err("relationshipToPatient")} />
          </div>
        </CardContent>
      </Card>

      {/* Venue & Location */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Venue &amp; Location</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2 sm:col-span-2 lg:col-span-2">
            <Label
              htmlFor="hospitalName"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Hospital / Venue Name
            </Label>
            <Input
              id="hospitalName"
              placeholder="Where donors should report"
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
            <Input id="pincode" {...register("pincode")} />
            <FieldError message={err("pincode")} />
          </div>
          <div className="space-y-2 sm:col-span-2 lg:col-span-3">
            <Label
              htmlFor="hospitalAddress"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Address
            </Label>
            <Input
              id="hospitalAddress"
              placeholder="Street address of the collection venue"
              {...register("hospitalAddress")}
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
            <Input id="city" {...register("city")} />
            <FieldError message={err("city")} />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="district"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              District
            </Label>
            <Input id="district" {...register("district")} />
            <FieldError message={err("district")} />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="state"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              State *
            </Label>
            <Input id="state" {...register("state")} />
            <FieldError message={err("state")} />
          </div>
        </CardContent>
      </Card>

      {/* Contact & Notes */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Contact &amp; Notes</CardTitle>
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
              placeholder="Who donors should ask for"
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
            <Input id="contactPhone" {...register("contactPhone")} />
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
              placeholder="Anything donors should know — documents to carry, parking, camp timings…"
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
          bankProfile?.institutionName
        )}
        confirmLabel={mode === "create" ? "Publish Request" : "Save Changes"}
        onConfirm={handleConfirm}
        confirmPending={activeMutation.isPending}
      />
    </form>
  );
}
