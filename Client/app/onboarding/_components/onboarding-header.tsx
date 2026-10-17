import Link from "next/link";
import { Home, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface OnboardingHeaderProps {
  icon: LucideIcon;
  /** Title shown on first-time onboarding. */
  title: string;
  /** Title shown when editing an existing profile. */
  updateTitle: string;
  /** Role/mode badge for first-time onboarding. */
  badge: string;
  updateBadge: string;
  description: string;
  updateDescription: string;
  isUpdateMode: boolean;
}

/** Top banner — icon, title, mode badge, and the dashboard escape link. */
export function OnboardingHeader({
  icon: Icon,
  title,
  updateTitle,
  badge,
  updateBadge,
  description,
  updateDescription,
  isUpdateMode,
}: OnboardingHeaderProps) {
  return (
    <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-border/80 bg-card/90 p-6 shadow-sm backdrop-blur-md sm:flex-row">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-xs">
          <Icon className="h-6 w-6 fill-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl font-bold tracking-tight">
              {isUpdateMode ? updateTitle : title}
            </h1>
            <Badge variant="outline" className="border-primary/30 text-primary">
              {isUpdateMode ? updateBadge : badge}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {isUpdateMode ? updateDescription : description}
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
  );
}
