import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StepCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
}

/** Consistent card shell for each wizard step: icon header + content. */
export function StepCard({
  icon: Icon,
  title,
  description,
  children,
}: StepCardProps) {
  return (
    <div className="animate-fade-up">
      <Card className="border-border/80 bg-card shadow-md">
        <CardContent className="space-y-6 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
                {title}
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {description}
              </p>
            </div>
          </div>
          <div className="space-y-5">{children}</div>
        </CardContent>
      </Card>
    </div>
  );
}
