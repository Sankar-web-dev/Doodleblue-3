import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const TONES = {
  primary: {
    box: "border-primary/20 bg-primary/5",
    icon: "text-primary",
  },
  emerald: {
    box: "border-emerald-500/20 bg-emerald-500/5",
    icon: "text-emerald-600",
  },
  muted: {
    box: "border-border/70 bg-muted/30",
    icon: "text-primary",
  },
} as const;

interface InfoBoxProps {
  icon: LucideIcon;
  title?: string;
  tone?: keyof typeof TONES;
  className?: string;
  children: ReactNode;
}

/** Callout panel for clinical guidance notes inside steps. */
export function InfoBox({
  icon: Icon,
  title,
  tone = "primary",
  className,
  children,
}: InfoBoxProps) {
  const styles = TONES[tone];
  return (
    <div className={cn("rounded-xl border p-4", styles.box, className)}>
      <div className="flex items-start gap-3">
        <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", styles.icon)} />
        <div className="text-xs text-muted-foreground">
          {title && (
            <p className="font-semibold text-foreground">{title}</p>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
