import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Tone = "default" | "destructive";

interface YesNoFieldProps {
  title: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  yesLabel?: string;
  noLabel?: string;
  /** Variant of the affirmative button when selected. */
  yesTone?: Tone;
  /** Variant of the negative button when selected. */
  noTone?: Tone;
  /** Rendered when `value === showChildrenWhen` (defaults to showing on "yes"). */
  children?: ReactNode;
  showChildrenWhen?: boolean;
  /** Render without its own border — for nesting inside a parent panel. */
  embedded?: boolean;
}

/** Reusable Yes/No toggle row used by the screening questions. */
export function YesNoField({
  title,
  description,
  value,
  onChange,
  yesLabel = "Yes",
  noLabel = "No",
  yesTone = "default",
  noTone = "default",
  children,
  showChildrenWhen = true,
  embedded = false,
}: YesNoFieldProps) {
  return (
    <>
      <div
        className={cn(
          "flex flex-col justify-between gap-3 sm:flex-row sm:items-center",
          !embedded && "rounded-xl border border-border/70 p-4"
        )}
      >
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={value ? yesTone : "outline"}
            onClick={() => onChange(true)}
          >
            {yesLabel}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={!value ? noTone : "outline"}
            onClick={() => onChange(false)}
          >
            {noLabel}
          </Button>
        </div>
      </div>
      {value === showChildrenWhen && children}
    </>
  );
}
