import { NextResponse } from "next/server";

import { getOwnProfile } from "@/lib/supabase/own-profile";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * Authorisation for administrative READ routes.
 *
 * Phase 2 revoked table-wide SELECT on `lessons`, `profiles` and `webinars`.
 * A column grant is role-wide — it cannot tell an admin from a learner — so the
 * admin console, whose pages are browser components, can no longer query those
 * tables directly. It calls routes that use the service role behind this check.
 *
 * The caller's role comes from `my_profile`, a definer view filtered to
 * `auth.uid()`. Never from the request, and never from a client-supplied field:
 * that is the difference between an authorisation check and a suggestion.
 */
export type Staff =
  | { ok: true; userId: string; role: string; organizationId: string | null }
  | { ok: false; response: NextResponse };

const STAFF_ROLES = ["super_admin", "instructor", "corporate_admin"];

export async function requireStaff(
  allowed: string[] = STAFF_ROLES
): Promise<Staff> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const profile = await getOwnProfile<{ role: string | null; organization_id: string | null }>(
    supabase,
    "role, organization_id"
  );
  const role = profile?.role ?? "";
  if (!allowed.includes(role)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return {
    ok: true,
    userId: user.id,
    role,
    organizationId: profile?.organization_id ?? null,
  };
}
