import type { LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

interface IconInputProps extends React.ComponentProps<typeof Input> {
  icon: LucideIcon;
}

/** Input with a leading Lucide icon. */
export function IconInput({ icon: Icon, ...props }: IconInputProps) {
  return (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input className="pl-9" {...props} />
    </div>
  );
}
