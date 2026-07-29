import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Read the signed-in user's own profile row, including its private columns.
 *
 * `public.profiles` no longer grants `email`, `phone`, `role` or
 * `organization_id` to `authenticated`. A table-wide SELECT grant was exposing
 * every user's contact details and role to every signed-in user, and a column
 * grant is role-wide — it cannot tell "my own row" from "someone else's".
 *
 * `public.my_profile` is a SECURITY DEFINER view filtered to `auth.uid()`, so
 * the caller still gets their own row in full. Prefer it over
 * `.from("profiles").select(...).eq("id", user.id)`, which now returns
 * "permission denied for column" for anything outside the public four.
 *
 * Needing *another* user's private columns means it is an administrative read:
 * do it server-side with the service-role client (`lib/supabase/admin.ts`)
 * behind a role check, never from the browser.
 */
export async function getOwnProfile<T = Record<string, unknown>>(
  supabase: SupabaseClient,
  columns = "*"
): Promise<T | null> {
  const { data } = await supabase.from("my_profile").select(columns).maybeSingle();
  return (data as T) ?? null;
}

/** Convenience for the very common "is this caller staff?" check. */
export async function getOwnRole(supabase: SupabaseClient): Promise<string | null> {
  const profile = await getOwnProfile<{ role: string | null }>(supabase, "role");
  return profile?.role ?? null;
}
