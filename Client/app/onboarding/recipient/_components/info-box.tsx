import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface InfoBoxProps {
  icon: LucideIcon;
  title: string;
  tone?: "primary" | "emerald" | "muted";
  className?: string;
  children: React.ReactNode;
}

const TONES = {
  primary:
    "border-primary/30 bg-primary/5 text-primary [&_p]:text-foreground/80",
  emerald:
    "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 [&_p]:text-foreground/80",
  muted: "border-border/70 bg-muted/40 text-muted-foreground",
};

/** Themed callout panel for guidance text inside a step. */
export function InfoBox({
  icon: Icon,
  title,
  tone = "primary",
  className,
  children,
}: InfoBoxProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4 text-xs leading-relaxed",
        TONES[tone],
        className
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p className="mb-1 font-semibold text-foreground">{title}</p>
        {children}
      </div>
    </div>
  );
}
