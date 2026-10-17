import Link from "next/link";
import { HeartHandshake, Home } from "lucide-react";
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
          <HeartHandshake className="h-6 w-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl font-bold tracking-tight">
              {isUpdateMode
                ? "Update Recipient Details"
                : "Blood Recipient Onboarding"}
            </h1>
            <Badge variant="outline" className="border-primary/30 text-primary">
              {isUpdateMode ? "Update Mode" : "Role: Blood Recipient"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {isUpdateMode
              ? "Edit and review your personal details and registration context."
              : "Complete your profile to request blood for yourself or someone in need."}
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
