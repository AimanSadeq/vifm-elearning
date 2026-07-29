import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase as createClient } from "@/lib/supabase/server";

import { supabaseAdmin } from "@/lib/supabase/admin";
/**
 * GET /api/admin/cpe-submissions
 * List CPE submissions with optional status filter.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const designationId = searchParams.get("designation_id");

  let query = supabase
    .from("cpe_submissions")
    .select(`
      *,
      cpe_categories (name, name_ar),
      designation_holders!inner (
        member_number,
        user_id,
        designation_id,
        designations (abbreviation, name)
      )
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  if (designationId) {
    query = query.eq("designation_holders.designation_id", designationId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch user profiles for each submission
  const userIds = [...new Set((data || []).map((s: Record<string, unknown>) => {
    const holder = s.designation_holders as Record<string, unknown> | null;
    return holder?.user_id as string;
  }).filter(Boolean))];

  // Other people's email — an administrative read, so it goes through the
  // service role. `authenticated` is granted only (id, full_name, full_name_ar,
  // avatar_url) on profiles; the route's super_admin guard above is what
  // authorises this.
  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, email")
    .in("id", userIds);

  const profileMap = new Map((profiles || []).map((p: Record<string, unknown>) => [p.id, p]));

  const enriched = (data || []).map((s: Record<string, unknown>) => {
    const holder = s.designation_holders as Record<string, unknown> | null;
    const userId = holder?.user_id as string;
    return {
      ...s,
      profile: profileMap.get(userId) || null,
    };
  });

  return NextResponse.json({ data: enriched });
}
