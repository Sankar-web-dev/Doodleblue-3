import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface StepCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
}

/** Card shell used by every wizard step — icon header + padded body. */
export function StepCard({ icon: Icon, title, description, children }: StepCardProps) {
  return (
    <Card className="animate-fade-up border-border/80 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-2">{children}</CardContent>
    </Card>
  );
}
