import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: React.ReactNode;
  variant?: "section" | "subtle";
  className?: string;
  children: React.ReactNode;
}

/** Label + control + hint/error wrapper used across all steps. */
export function FormField({
  label,
  htmlFor,
  error,
  hint,
  variant = "section",
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label
        htmlFor={htmlFor}
        className={cn(
          variant === "section"
            ? "text-sm font-semibold text-foreground"
            : "text-xs font-medium text-muted-foreground"
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
