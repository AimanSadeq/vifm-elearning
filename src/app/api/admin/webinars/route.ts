import { NextRequest, NextResponse } from "next/server";

import { requireStaff } from "@/lib/api/admin-guard";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * GET /api/admin/webinars[?id=…]
 *
 * Full webinar rows — including `meeting_url`, `meeting_id` and `metadata`,
 * which phase 2 withholds from `authenticated` because they are what gets
 * someone into the room. The admin console needs them to edit a webinar, and a
 * column grant cannot distinguish an admin, so it reads them here instead.
 *
 * Also embeds the instructor's name, which is another read the browser client
 * can no longer perform against `profiles`.
 */
export async function GET(request: NextRequest) {
  const caller = await requireStaff(["super_admin", "instructor"]);
  if (!caller.ok) return caller.response;

  const id = request.nextUrl.searchParams.get("id");

  let query = supabaseAdmin
    .from("webinars")
    .select("*, instructor:profiles!webinars_instructor_id_fkey(id, full_name, full_name_ar)");

  if (id) {
    const { data, error } = await query.eq("id", id).maybeSingle();
    if (error) {
      console.error("[admin/webinars]", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
    return NextResponse.json({ webinar: data });
  }

  if (caller.role === "instructor") {
    query = query.eq("instructor_id", caller.userId);
  }

  const { data, error } = await query.order("scheduled_at", { ascending: false });
  if (error) {
    console.error("[admin/webinars]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ webinars: data ?? [] });
}
