import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/api/require-admin";

import { supabaseAdmin } from "@/lib/supabase/admin";
/**
 * Enrol someone else in a course, from the admin console.
 *
 * `authenticated` no longer holds INSERT on `enrollments` — a learner could
 * otherwise write itself into any paid course with one request. Learners enrol
 * through the `enrol_in_course` RPC, which re-checks entitlement; an admin
 * granting access deliberately bypasses that check, so it happens here, behind
 * a super_admin guard, with the service role.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = (await req.json().catch(() => null)) as
    | { userId?: string; courseId?: string }
    | null;
  if (!body?.userId || !body?.courseId) {
    return NextResponse.json(
      { error: "userId and courseId are required" },
      { status: 400 }
    );
  }

  const { data: existing } = await supabaseAdmin
    .from("enrollments")
    .select("id")
    .eq("user_id", body.userId)
    .eq("course_id", body.courseId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "User is already enrolled in this course" },
      { status: 409 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("enrollments")
    .insert({
      user_id: body.userId,
      course_id: body.courseId,
      status: "active",
      enrolled_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
