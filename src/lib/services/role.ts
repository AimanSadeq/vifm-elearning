import type { User } from "@supabase/supabase-js";

/**
 * Role check for the authenticated user. Both `app_metadata.role` (set by
 * admins via the Supabase admin API, baked into the JWT) and `profiles.role`
 * (in the public schema, mirrored by the ensure-profile route) are in use
 * across the codebase — `app_metadata` is preferred when the user object is
 * already available because it avoids a DB round-trip.
 *
 * Rule of thumb when adding new code:
 *   • Already have `user`?           → use these helpers (`app_metadata.role`)
 *   • Already querying `profiles`?   → reuse `profiles.role` from that query
 *
 * `ensure-profile` keeps the two in sync at user creation time.
 */
export function getUserRole(user: User | null | undefined): string | null {
  if (!user) return null;
  const r = user.app_metadata?.role;
  return typeof r === "string" ? r : null;
}

export function isSuperAdmin(user: User | null | undefined): boolean {
  return getUserRole(user) === "super_admin";
}

/**
 * "Staff" = anyone with elevated access on the platform (admin or instructor).
 * Use for content-management gates that should bypass subscription/plan checks.
 */
export function isStaff(user: User | null | undefined): boolean {
  const r = getUserRole(user);
  return r === "super_admin" || r === "instructor";
}
