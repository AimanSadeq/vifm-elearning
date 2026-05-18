import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { recalculateAllPathsForUser } from "@/lib/services/learning-path-service";
import { issueCourseBadge, isBadgesEnabled } from "@/lib/services/badges-client";
import { getCourseSurveyStatus } from "@/lib/services/survey-service";

interface RouteParams {
  params: Promise<{ lessonId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { lessonId } = await params;
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Body is allowed but courseId is intentionally NOT trusted from it —
    // a learner enrolled in a free course could otherwise mark lessons of
    // any paid course as completed by sending the free course's id with
    // any lesson id. We derive the canonical course id from the lesson row.
    try {
      await request.json().catch(() => ({}));
    } catch {
      // empty body is fine
    }

    const { data: lesson } = await supabaseAdmin
      .from("lessons")
      .select("id, course_id")
      .eq("id", lessonId)
      .maybeSingle();

    if (!lesson?.course_id) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }
    const courseId = lesson.course_id as string;

    // Admins can complete lessons without enrollment
    const isAdmin = user.app_metadata?.role === "super_admin";

    // Verify enrollment against the lesson's actual course
    const { data: enrollment } = await supabaseAdmin
      .from("enrollments")
      .select("id, completed_lesson_ids, total_lesson_items")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .in("status", ["active", "completed"])
      .maybeSingle();

    if (!enrollment && !isAdmin)
      return NextResponse.json(
        { error: "Not enrolled in this course" },
        { status: 403 }
      );

    // Upsert lesson_progress as completed
    const { error: progressError } = await supabaseAdmin
      .from("lesson_progress")
      .upsert(
        {
          user_id: user.id,
          lesson_id: lessonId,
          course_id: courseId,
          is_completed: true,
          completed_at: new Date().toISOString(),
          last_accessed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,lesson_id" }
      );

    if (progressError)
      return NextResponse.json(
        { error: progressError.message },
        { status: 500 }
      );

    // Update enrollment completed_lesson_ids and progress (skip if admin without enrollment)
    let courseCompleted = false;
    if (enrollment) {
      const completedIds: string[] =
        (enrollment.completed_lesson_ids as string[]) ?? [];

      if (!completedIds.includes(lessonId)) {
        completedIds.push(lessonId);
      }

      const totalItems = enrollment.total_lesson_items ?? 0;
      const completedItems = completedIds.length;
      const progressPct =
        totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
      courseCompleted = totalItems > 0 && completedItems >= totalItems;

      await supabaseAdmin
        .from("enrollments")
        .update({
          last_lesson_id: lessonId,
          last_accessed_at: new Date().toISOString(),
          completed_lesson_ids: completedIds,
          completed_lesson_items: completedItems,
          progress_percentage: progressPct,
          ...(courseCompleted
            ? { status: "completed", completed_at: new Date().toISOString() }
            : {}),
        })
        .eq("id", enrollment.id);

      if (courseCompleted) {
        recalculateAllPathsForUser(supabase, user.id).catch(() => {});

        // Fire-and-forget badge issuance. Idempotent at the badges service
        // on (courseId, userId), so the safety-net call inside
        // issueCertificate is harmless if both fire. Never block the
        // completion response on a slow/down badges service.
        if (isBadgesEnabled()) {
          (async () => {
            try {
              const [{ data: profile }, { data: courseRow }] = await Promise.all(
                [
                  supabaseAdmin
                    .from("profiles")
                    .select("full_name, email")
                    .eq("id", user.id)
                    .single(),
                  supabaseAdmin
                    .from("courses")
                    .select("title, badge_template_external_id")
                    .eq("id", courseId)
                    .single(),
                ]
              );
              if (!courseRow?.badge_template_external_id) return;
              const r = await issueCourseBadge({
                userId: user.id,
                userName: profile?.full_name ?? "Learner",
                userEmail: profile?.email ?? undefined,
                courseId,
                courseTitle: courseRow.title ?? undefined,
                templateExternalId: courseRow.badge_template_external_id,
              });
              if (!r.ok) {
                console.warn(
                  `[badges] issue failed for user=${user.id} course=${courseId}: ${r.error}`
                );
              }
            } catch (err) {
              console.warn("[badges] issue threw", err);
            }
          })();
        }
      }
    }

    // Tell the client whether the course just completed AND whether a
    // post-course survey is blocking the cert/badge. Lets the player
    // open the survey modal at the right moment without a second
    // round-trip.
    let surveyStatus = {
      hasSurvey: false,
      isRequired: false,
      hasResponded: false,
      blocking: false,
    };
    if (courseCompleted) {
      const s = await getCourseSurveyStatus(user.id, courseId);
      surveyStatus = {
        hasSurvey: s.hasSurvey,
        isRequired: s.isRequired,
        hasResponded: s.hasResponded,
        blocking: s.blocking,
      };
    }
    return NextResponse.json({
      success: true,
      courseCompleted,
      survey: surveyStatus,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
