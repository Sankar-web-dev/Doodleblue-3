import type { BloodGroup } from "@/api/profiles.api";
import { BLOOD_GROUPS } from "../_lib/constants";
import { cn } from "@/lib/utils";

interface BloodGroupPickerProps {
  value: BloodGroup;
  onChange: (value: BloodGroup) => void;
}

/**
 * 8-tile blood group selector. Descriptions wrap to two lines so the full
 * text stays visible instead of being truncated.
 */
export function BloodGroupPicker({ value, onChange }: BloodGroupPickerProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {BLOOD_GROUPS.map((bg) => {
        const isSelected = value === bg.value;
        return (
          <button
            key={bg.value}
            type="button"
            onClick={() => onChange(bg.value)}
            className={cn(
              "relative flex min-h-[92px] flex-col items-center justify-center rounded-xl border p-3 text-center transition-all",
              isSelected
                ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/40 shadow-xs"
                : "border-border/80 bg-card hover:border-primary/40 hover:bg-muted/40"
            )}
          >
            <span className="font-display text-2xl font-black">{bg.label}</span>
            <span className="mt-1 text-[11px] leading-snug text-muted-foreground">
              {bg.desc}
            </span>
          </button>
        );
      })}
    </div>
  );
}
