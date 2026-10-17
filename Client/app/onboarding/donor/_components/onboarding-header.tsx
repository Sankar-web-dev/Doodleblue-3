import Link from "next/link";
import { Droplet, Home } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface OnboardingHeaderProps {
  isUpdateMode: boolean;
}

/** Top banner — title, mode badge, and the dashboard escape link. */
export function OnboardingHeader({ isUpdateMode }: OnboardingHeaderProps) {
  return (
    <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-border/80 bg-card/90 p-6 shadow-sm backdrop-blur-md sm:flex-row">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-xs">
          <Droplet className="h-6 w-6 fill-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl font-bold tracking-tight">
              {isUpdateMode
                ? "Update Donor Health Details"
                : "Blood Donor Onboarding"}
            </h1>
            <Badge variant="outline" className="border-primary/30 text-primary">
              {isUpdateMode ? "Update Health Mode" : "Role: Blood Donar"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {isUpdateMode
              ? "Edit and review your clinical screening parameters, availability, and preferences."
              : "Complete your clinical screening to activate donor status & save lives."}
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
