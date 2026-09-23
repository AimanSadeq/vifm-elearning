import { NextResponse } from "next/server";

import { requireStaff } from "@/lib/api/admin-guard";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * GET /api/admin/courses/lesson-counts
 *
 * `{ [courseId]: lessonCount }` for the course analytics table, which used to
 * get this from a `lessons:lessons(count)` embed. An aggregate embed still
 * needs SELECT on the embedded table, so it fails the same way a full read
 * does — a count is not a lesser privilege.
 */
export async function GET() {
  const caller = await requireStaff();
  if (!caller.ok) return caller.response;

  const { data, error } = await supabaseAdmin.from("lessons").select("course_id");
  if (error) {
    console.error("[admin/courses/lesson-counts]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const id = String((row as { course_id: string | null }).course_id ?? "");
    if (id) counts[id] = (counts[id] ?? 0) + 1;
  }
  return NextResponse.json({ counts });
}
