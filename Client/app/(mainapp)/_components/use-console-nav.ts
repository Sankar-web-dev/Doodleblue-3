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

  return useMemo(
    () =>
      NAV_ITEMS.filter((item) => {
        if (user?.role === "SUPER_ADMIN") return true;
        if (item.resource && !can(item.resource, "read")) return false;
        if (item.roleIncludes) {
          const roleLower = (user?.role ?? "").toLowerCase();
          const matches = Array.isArray(item.roleIncludes)
            ? item.roleIncludes.some((r) => roleLower.includes(r.toLowerCase()))
            : roleLower.includes(item.roleIncludes.toLowerCase());
          if (!matches) return false;
        }
        return true;
      }),
    [can, user?.role]
  );
}
