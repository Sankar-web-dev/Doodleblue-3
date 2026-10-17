import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: ReactNode;
  htmlFor?: string;
  /** "section" = uppercase tracking-wider labels, "subtle" = plain nested labels */
  variant?: "section" | "subtle";
  hint?: ReactNode;
  error?: string;
  className?: string;
  children: ReactNode;
}

/** Label + control + optional hint/error wrapper shared across steps. */
export function FormField({
  label,
  htmlFor,
  variant = "section",
  hint,
  error,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label
        htmlFor={htmlFor}
        className={cn(
          "text-xs",
          variant === "section"
            ? "font-semibold uppercase tracking-wider text-muted-foreground"
            : "text-muted-foreground"
        )}
      >
        {label}
      </Label>
      {children}
      {hint}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
