import { NextRequest, NextResponse } from "next/server";

import { createServerSupabase } from "@/lib/supabase/server";
import { escapeIlike } from "@/lib/utils/escape-search";

import { getOwnProfile } from "@/lib/supabase/own-profile";
import { supabaseAdmin } from "@/lib/supabase/admin";
/**
 * Administrative reads of other people's profiles.
 *
 * `public.profiles` grants `authenticated` only (id, full_name, full_name_ar,
 * avatar_url). Email, phone, role and organization_id are private, and a column
 * grant is role-wide — it cannot distinguish an admin from a learner. So the
 * admin and corporate consoles, which are browser components, can no longer
 * query the table directly; they call this route, which uses the service role
 * behind an authorisation check.
 *
 * The caller's role and organization are read from `my_profile` (a definer view
 * filtered to auth.uid()), never from the request or from client-supplied
 * fields — otherwise this route would be an open door to every user's email.
 *
 *   super_admin      unrestricted
 *   corporate_admin  forced to their own organization_id
 *   instructor       only learners enrolled in a course they teach, by id
 *   everyone else    403
 */

/** The only columns this route will ever return. */
const COLUMNS =
  "id, full_name, full_name_ar, email, phone, role, organization_id, department, language, is_active, last_login_at, created_at";

const ROLES = ["super_admin", "instructor", "corporate_admin", "learner"];
const MAX_PAGE_SIZE = 200;

type Caller =
  | { ok: true; role: string; organizationId: string | null; userId: string }
  | { ok: false; response: NextResponse };

async function authorise(): Promise<Caller> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const profile = await getOwnProfile<{ role: string | null; organization_id: string | null }>(
    supabase,
    "role, organization_id"
  );
  const role = profile?.role ?? "";
  if (role !== "super_admin" && role !== "corporate_admin" && role !== "instructor") {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  // A corporate admin with no organization can see nobody, not everybody.
  if (role === "corporate_admin" && !profile?.organization_id) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return {
    ok: true,
    role,
    organizationId: profile?.organization_id ?? null,
    userId: user.id,
  };
}

export async function GET(req: NextRequest) {
  const caller = await authorise();
  if (!caller.ok) return caller.response;

  const p = req.nextUrl.searchParams;
  const countOnly = p.get("countOnly") === "1";
  const pageSize = Math.min(Number(p.get("pageSize")) || 50, MAX_PAGE_SIZE);
  const page = Math.max(Number(p.get("page")) || 0, 0);

  let query = supabaseAdmin
    .from("profiles")
    .select(countOnly ? "id" : COLUMNS, { count: "exact", head: countOnly });

  // Scope BEFORE any caller-supplied filter, so nothing can widen it.
  if (caller.role === "corporate_admin") {
    query = query.eq("organization_id", caller.organizationId!);
  } else if (caller.role === "super_admin") {
    const org = p.get("organizationId");
    if (org) query = query.eq("organization_id", org);
  }

  let ids = (p.get("ids") ?? "").split(",").map((s) => s.trim()).filter(Boolean);

  if (caller.role === "instructor") {
    // An instructor may look up their own students and nobody else. Requiring
    // ids keeps this a lookup rather than a directory, and the intersection
    // below is what actually enforces it.
    if (!ids.length) {
      return NextResponse.json({ error: "ids is required" }, { status: 400 });
    }
    const { data: mine } = await supabaseAdmin
      .from("enrollments")
      .select("user_id, courses!inner(instructor_id)")
      .eq("courses.instructor_id", caller.userId)
      .in("user_id", ids.slice(0, MAX_PAGE_SIZE));
    const allowed = new Set((mine ?? []).map((r) => (r as { user_id: string }).user_id));
    ids = ids.filter((id) => allowed.has(id));
    if (!ids.length) return NextResponse.json({ rows: [], count: 0 });
  }

  if (ids.length) query = query.in("id", ids.slice(0, MAX_PAGE_SIZE));

  const role = p.get("role");
  if (role && role !== "all") {
    if (!ROLES.includes(role)) {
      return NextResponse.json({ error: "Unknown role" }, { status: 400 });
    }
    query = query.eq("role", role);
  }

  // `roles=super_admin,instructor` — the console's "pick an instructor" lists
  // need more than one, and a second round-trip per role is wasteful.
  const roles = (p.get("roles") ?? "").split(",").map((r) => r.trim()).filter(Boolean);
  if (roles.length) {
    const unknown = roles.filter((r) => !ROLES.includes(r));
    if (unknown.length) {
      return NextResponse.json({ error: `Unknown role: ${unknown[0]}` }, { status: 400 });
    }
    query = query.in("role", roles);
  }

  const isActive = p.get("isActive");
  if (isActive === "true" || isActive === "false") {
    query = query.eq("is_active", isActive === "true");
  }

  const search = p.get("search");
  if (search) {
    const s = escapeIlike(search);
    query = query.or(`full_name.ilike.%${s}%,email.ilike.%${s}%`);
  }

  if (!countOnly) {
    const orderBy = p.get("orderBy") === "full_name" ? "full_name" : "created_at";
    query = query
      .order(orderBy, { ascending: orderBy === "full_name" })
      .range(page * pageSize, page * pageSize + pageSize - 1);
  }

  const { data, count, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rows: data ?? [], count: count ?? 0 });
}

/** Activate / deactivate an account. Super admins only. */
export async function PATCH(req: NextRequest) {
  const caller = await authorise();
  if (!caller.ok) return caller.response;
  if (caller.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as
    | { id?: string; is_active?: boolean }
    | null;
  if (!body?.id || typeof body.is_active !== "boolean") {
    return NextResponse.json({ error: "id and is_active are required" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ is_active: body.is_active })
    .eq("id", body.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
