import { NextRequest, NextResponse } from "next/server";

import { requireStaff } from "@/lib/api/admin-guard";
import { supabaseAdmin } from "@/lib/supabase/admin";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/courses/:id/curriculum
 *
 * Modules with their lessons, in full, for the admin course editor and the
 * video manager.
 *
 * The console used to run `.from("modules").select("*, lessons(*)")` from the
 * browser. Phase 2 revoked SELECT on `lessons`, and a PostgREST embed needs the
 * privilege on the embedded table too, so that query now returns
 * `42501 permission denied for table lessons` — which is what broke the course
 * editor. The service role is not subject to those grants; this route is the
 * supported way to make the same read.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const caller = await requireStaff();
  if (!caller.ok) return caller.response;

  const { id } = await params;

  // An instructor may only open a course they teach.
  if (caller.role === "instructor") {
    const { data: course } = await supabaseAdmin
      .from("courses")
      .select("instructor_id")
      .eq("id", id)
      .maybeSingle();
    if (!course || course.instructor_id !== caller.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { data, error } = await supabaseAdmin
    .from("modules")
    .select("*, lessons(*)")
    .eq("course_id", id)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[admin/courses/:id/curriculum]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Lessons come back in insertion order inside the embed; sort them here so
  // every caller sees the curriculum in the order the learner will.
  const modules = (data ?? []).map((m) => {
    const lessons = [...(((m as { lessons?: { sort_order?: number }[] }).lessons) ?? [])];
    lessons.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    return { ...m, lessons };
  });

  return NextResponse.json({ modules });
}
