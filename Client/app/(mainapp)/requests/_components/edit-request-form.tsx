"use client";

import Link from "next/link";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { useRequest } from "../_hooks/use-requests";
import { fromRequest } from "../_lib/request-form";
import { RequestForm } from "./request-form";

interface EditRequestFormProps {
  requestId: string;
}

export function EditRequestForm({ requestId }: EditRequestFormProps) {
  const { data: request, isPending, error } = useRequest(requestId);

  if (isPending) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading request…
      </div>
    );
  }

  if (error || !request) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error instanceof Error
              ? error.message
              : "This request could not be found."}
          </div>
          <Button size="sm" variant="outline" asChild>
            <Link href="/requests">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Back to requests
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <RequestForm
      mode="edit"
      requestId={request.id}
      defaultValues={fromRequest(request)}
    />
  );
}
