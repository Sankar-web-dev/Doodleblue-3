/**
 * Role-name helpers shared across modules.
 *
 * SUPER_ADMIN is the hardcoded system role. All other roles are custom
 * documents in the Role collection.
 */
export function isSuperAdminRole(roleName: string): boolean {
  return roleName === "SUPER_ADMIN";
}
