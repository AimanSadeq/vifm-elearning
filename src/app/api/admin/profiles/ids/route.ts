import { NextRequest, NextResponse } from "next/server";

import { requireStaff } from "@/lib/api/admin-guard";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { escapeIlike } from "@/lib/utils/escape-search";

/**
 * GET /api/admin/profiles/ids?scope=all|role|email
 *
 * Resolves a set of recipients to user IDS ONLY — no names, no addresses.
 *
 * The admin notification composer used to select these straight from
 * `profiles`, filtering on `is_active`, `role` or `email`. Phase 2 grants
 * `authenticated` only four public columns, and PostgREST needs the privilege
 * to FILTER on a column as much as to return it, so all three lookups now fail.
 *
 * This is deliberately separate from `/api/admin/profiles`: that route is a
 * paged directory capped at 200 rows, which is the right shape for a table and
 * the wrong shape for "everyone" — there are thousands of learners. Returning
 * bare ids keeps the unbounded response cheap and free of personal data.
 */
export async function GET(request: NextRequest) {
  const caller = await requireStaff(["super_admin"]);
  if (!caller.ok) return caller.response;

  const p = request.nextUrl.searchParams;
  const scope = p.get("scope") ?? "all";

  let query = supabaseAdmin.from("profiles").select("id").eq("is_active", true);

  if (scope === "role") {
    const role = p.get("role");
    if (!role) {
      return NextResponse.json({ error: "role is required when scope=role" }, { status: 400 });
    }
    query = query.eq("role", role);
  } else if (scope === "email") {
    const email = (p.get("email") ?? "").trim();
    if (!email) {
      return NextResponse.json({ error: "email is required when scope=email" }, { status: 400 });
    }
    // Case-insensitive: admins routinely paste mixed-case addresses and the
    // column is not stored lower-cased.
    query = query.ilike("email", escapeIlike(email));
  } else if (scope !== "all") {
    return NextResponse.json({ error: "Unknown scope" }, { status: 400 });
  }

  const { data, error } = await query;
  if (error) {
    console.error("[admin/profiles/ids]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ids: (data ?? []).map((r) => r.id as string) });
}
