import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

import { getOwnRole } from "@/lib/supabase/own-profile";
type SupabaseClient = Awaited<ReturnType<typeof createServerSupabase>>;
type UserOf<T> = T extends { auth: { getUser: () => Promise<{ data: { user: infer U } }> } }
  ? NonNullable<U>
  : never;
type User = UserOf<SupabaseClient>;

export type AdminGuardResult =
  | { ok: true; user: User; supabase: SupabaseClient }
  | { ok: false; response: NextResponse };

/**
 * Reusable admin auth guard for /api/admin routes. Mirrors the inline
 * pattern used throughout the codebase (auth.getUser → profile.role ===
 * 'super_admin') so behaviour is identical.
 */
export async function requireAdmin(): Promise<AdminGuardResult> {
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

  const role = await getOwnRole(supabase);
  if (role !== "super_admin") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true, user, supabase };
}
