import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/require-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Cross-course list — every survey with course title + response count
 * for the admin overview page.
 */
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { data: surveys, error } = await supabaseAdmin
    .from("course_surveys")
    .select(
      "id, course_id, title, title_ar, is_required, is_active, created_at, course:courses!course_surveys_course_id_fkey(title, title_ar, slug)"
    )
    .order("created_at", { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  if (!surveys || surveys.length === 0)
    return NextResponse.json({ data: [] });

  // Batch fetch response counts to avoid N+1.
  const ids = surveys.map((s) => s.id);
  const { data: counts } = await supabaseAdmin
    .from("survey_responses")
    .select("survey_id")
    .in("survey_id", ids);

  const countMap = new Map<string, number>();
  for (const r of counts ?? []) {
    countMap.set(r.survey_id, (countMap.get(r.survey_id) ?? 0) + 1);
  }

  return NextResponse.json({
    data: surveys.map((s) => ({
      ...s,
      response_count: countMap.get(s.id) ?? 0,
    })),
  });
}
