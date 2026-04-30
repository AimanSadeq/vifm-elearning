import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSuperAdmin } from "./role";

/**
 * Centralized auth + super_admin gate for admin route handlers. Returns the
 * user when authorized, or a `NextResponse` to short-circuit the handler with
 * 401/403. Avoids the duplicated `auth.getUser` + `select role from profiles`
 * dance every admin route was doing.
 */
export async function requireSuperAdmin(): Promise<
  | { user: User; error?: undefined }
  | { user?: undefined; error: NextResponse }
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

  // Prefer the JWT claim (no DB round-trip). Fall back to the profiles row
  // for the case where app_metadata.role wasn't synced yet.
  if (isSuperAdmin(user)) return { user };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role === "super_admin") return { user };

  return {
    error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
  };
}
