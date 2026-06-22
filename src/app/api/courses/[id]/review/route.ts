import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// POST /api/courses/[id]/review — upsert the learner's course rating (1-5) +
// optional text. One review per (user, course) via the table's unique
// constraint, so re-submitting updates the existing one.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: courseId } = await params;

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const rating = Number(body?.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "Rating must be an integer from 1 to 5." },
      { status: 400 },
    );
  }
  const reviewText =
    typeof body?.reviewText === "string"
      ? body.reviewText.trim().slice(0, 2000) || null
      : null;

  // Only enrolled learners may review.
  const { data: enrollment } = await supabaseAdmin
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .maybeSingle();
  if (!enrollment) {
    return NextResponse.json(
      { error: "You must be enrolled to review this course." },
      { status: 403 },
    );
  }

  const { error } = await supabaseAdmin.from("reviews").upsert(
    {
      user_id: user.id,
      course_id: courseId,
      rating,
      review_text: reviewText,
    },
    { onConflict: "user_id,course_id" },
  );
  if (error) {
    console.error("[review] upsert failed:", error.message);
    return NextResponse.json({ error: "Could not save review" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
