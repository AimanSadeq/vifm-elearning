import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/require-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { issueCourseBadge, isBadgesEnabled } from "@/lib/services/badges-client";

/**
 * Admin-triggered manual badge issuance. Idempotent on (courseId, userId)
 * via the underlying issueCourseBadge helper — re-clicking returns the
 * same badge rather than duplicating.
 */
export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  if (!isBadgesEnabled()) {
    return NextResponse.json(
      { error: "Badges integration is not configured." },
      { status: 503 }
    );
  }

  let body: { userId?: string; courseId?: string; templateExternalId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { userId, courseId, templateExternalId } = body;
  if (!userId || !courseId) {
    return NextResponse.json(
      { error: "userId and courseId are required" },
      { status: 400 }
    );
  }

  // Resolve user (full name + email) and course (title + template).
  const [{ data: profile }, { data: course }] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("full_name, email")
      .eq("id", userId)
      .single(),
    supabaseAdmin
      .from("courses")
      .select("title, badge_template_external_id")
      .eq("id", courseId)
      .single(),
  ]);

  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const templateId =
    templateExternalId ?? course.badge_template_external_id ?? null;
  if (!templateId) {
    return NextResponse.json(
      {
        error:
          "No badge template assigned to this course and none was provided.",
      },
      { status: 400 }
    );
  }

  const result = await issueCourseBadge({
    userId,
    userName: profile.full_name ?? "Learner",
    userEmail: profile.email ?? undefined,
    courseId,
    courseTitle: course.title ?? undefined,
    templateExternalId: templateId,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "Failed to issue badge" },
      { status: result.status ?? 502 }
    );
  }

  return NextResponse.json({ data: result.data }, { status: 201 });
}
