import {
  Award,
  Building2,
  CalendarClock,
  Droplet,
  HeartHandshake,
  LayoutDashboard,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { Resource } from "@/lib/permissions";

export type NavItem = {
  href: string;
  label: string;
  icon: typeof ShieldCheck;
  /**
   * Permission resource gating this nav item — the user needs "read" on it.
   * Omit for items every authenticated user can see (e.g. Dashboard).
   */
  resource?: Resource;
  /**
   * Role-name substring (lowercase) gating this item — e.g. "bank" shows it
   * only for blood bank accounts. Can also be an array of matching role substrings.
   */
  roleIncludes?: string | string[];
};

/**
 * All sidebar navigation items. The shell filters this list with
 * `usePermissions` — gated items are shown only when the user has "read"
 * access to that resource (SUPER_ADMIN sees everything).
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/roles",     label: "Roles",     icon: ShieldCheck,    resource: "roles" },
  { href: "/users",     label: "Users",     icon: Users,          resource: "users" },
  { href: "/blood-banks", label: "Blood Banks", icon: Building2,  resource: "users" },
  { href: "/requests",    label: "Blood Requests", icon: Droplet, roleIncludes: ["bank", "recip"] },
  { href: "/responses",   label: "My Responses", icon: HeartHandshake, roleIncludes: "dona" },
  { href: "/donations",   label: "My Donations", icon: Award, roleIncludes: "dona" },
  { href: "/appointments", label: "Appointments", icon: CalendarClock, roleIncludes: "bank" },
  { href: "/appointments", label: "My Appointments", icon: CalendarClock, roleIncludes: "dona" },
];
