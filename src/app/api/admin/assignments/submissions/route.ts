import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/require-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const params = request.nextUrl.searchParams;
  const status = params.get("status") ?? "all";
  const courseId = params.get("course_id");

  let query = supabaseAdmin
    .from("assignment_submissions")
    .select(
      `id, lesson_id, course_id, user_id, enrollment_id, text_response, file_url, file_name, file_size,
       status, grade, feedback, graded_by, graded_at, submitted_at, updated_at,
       user:profiles!assignment_submissions_user_id_fkey(full_name, email),
       lesson:lessons!assignment_submissions_lesson_id_fkey(title, assignment_max_points),
       course:courses!assignment_submissions_course_id_fkey(title, slug)`
    )
    .order("submitted_at", { ascending: false })
    .limit(200);

  if (status !== "all") {
    query = query.eq("status", status);
  }
  if (courseId) {
    query = query.eq("course_id", courseId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: data ?? [] });
}
