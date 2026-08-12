import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createServerSupabase } from "@/lib/supabase/server";
import { getOwnProfile } from "@/lib/supabase/own-profile";

/**
 * Auth gate for corporate self-service routes. Returns the caller and their
 * organization when they are a corporate_admin WITH an organization; a
 * corporate admin without one can manage nobody, not everybody.
 *
 * The organization always comes from the caller's own profile row (my_profile
 * definer view) — never from the request — so a corporate admin cannot operate
 * on another company by editing the payload.
 */
export async function requireCorporateAdmin(): Promise<
  | { user: User; organizationId: string; error?: undefined }
  | { user?: undefined; organizationId?: undefined; error: NextResponse }
> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const profile = await getOwnProfile<{
    role: string | null;
    organization_id: string | null;
  }>(supabase, "role, organization_id");

  if (profile?.role !== "corporate_admin" || !profile.organization_id) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { user, organizationId: profile.organization_id };
}
