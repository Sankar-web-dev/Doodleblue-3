"use client";

import { useMemo } from "react";

import type { AuthUser } from "@/api/auth.api";
import { usePermissions } from "@/lib/permissions";
import { NAV_ITEMS, type NavItem } from "./console-nav";

/**
 * Sidebar nav visibility.
 *
 * Every gated item requires "read" on its resource. SUPER_ADMIN always sees
 * everything.
 */
export function useConsoleNav(user: AuthUser | null): NavItem[] {
  const { can } = usePermissions(user);

  return useMemo(() => {
    const isSuperAdmin = user?.role === "SUPER_ADMIN";
    const roleLower = (user?.role ?? "").toLowerCase();
    const seenHrefs = new Set<string>();

    return NAV_ITEMS.filter((item) => {
      if (isSuperAdmin) {
        // SUPER_ADMIN sees the general "Appointments" link, omit duplicate donor-specific label
        if (item.label === "My Appointments") return false;
        if (seenHrefs.has(item.href)) return false;
        seenHrefs.add(item.href);
        return true;
      }

      if (item.resource && !can(item.resource, "read")) return false;

      if (item.roleIncludes) {
        const matches = Array.isArray(item.roleIncludes)
          ? item.roleIncludes.some((r) => roleLower.includes(r.toLowerCase()))
          : roleLower.includes(item.roleIncludes.toLowerCase());
        if (!matches) return false;
      }

      if (seenHrefs.has(item.href)) return false;
      seenHrefs.add(item.href);
      return true;
    });
  }, [can, user?.role]);
}
