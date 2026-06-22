import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Returns the ids of every lesson the user has completed in a course, read
 * straight from the authoritative `lesson_progress` table.
 *
 * Why: enrollment progress used to be derived from `enrollments.completed_lesson_ids`,
 * a JSON array maintained with a read-modify-write (read array → append one →
 * write whole array). Concurrent/rapid lesson completions clobber each other
 * (lost updates), so the array — and the `progress_percentage` computed from it
 * — drifts far below reality (e.g. a finished course stuck at 7%). The
 * `lesson_progress` table uses per-row upserts and never has that problem, so
 * every completion path should count from here instead.
 */
export async function getCompletedLessonIds(
  userId: string,
  courseId: string,
): Promise<string[]> {
  const { data } = await supabaseAdmin
    .from("lesson_progress")
    .select("lesson_id")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .eq("is_completed", true);
  return (data ?? []).map((r) => r.lesson_id as string);
}

/**
 * Recomputes ALL of a learner's enrollments straight from lesson_progress +
 * the live lesson count, and writes back progress_percentage / completed /
 * total / status. This is the authoritative source the player uses, so the
 * dashboard and My Courses match it regardless of any stale denominator. Cheap:
 * 3 reads + writes only for enrollments whose value actually changed.
 */
export async function syncLearnerProgress(userId: string): Promise<void> {
  const { data: enrollments } = await supabaseAdmin
    .from("enrollments")
    .select("id, course_id, status, progress_percentage, completed_at")
    .eq("user_id", userId);
  if (!enrollments?.length) return;

  const courseIds = [
    ...new Set(enrollments.map((e) => e.course_id as string)),
  ];

  const [{ data: progressRows }, { data: lessonRows }] = await Promise.all([
    supabaseAdmin
      .from("lesson_progress")
      .select("course_id")
      .eq("user_id", userId)
      .eq("is_completed", true)
      .in("course_id", courseIds),
    supabaseAdmin.from("lessons").select("course_id").in("course_id", courseIds),
  ]);

  const completedByCourse = new Map<string, number>();
  for (const r of progressRows ?? []) {
    const cid = r.course_id as string;
    completedByCourse.set(cid, (completedByCourse.get(cid) ?? 0) + 1);
  }
  const totalByCourse = new Map<string, number>();
  for (const r of lessonRows ?? []) {
    const cid = r.course_id as string;
    totalByCourse.set(cid, (totalByCourse.get(cid) ?? 0) + 1);
  }

  await Promise.all(
    enrollments.map(async (e) => {
      const cid = e.course_id as string;
      const total = totalByCourse.get(cid) ?? 0;
      const completed = Math.min(completedByCourse.get(cid) ?? 0, total);
      const pct = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
      const done = total > 0 && completed >= total;

      const unchanged =
        pct === e.progress_percentage && (!done || e.status === "completed");
      if (unchanged) return;

      await supabaseAdmin
        .from("enrollments")
        .update({
          completed_lesson_items: completed,
          total_lesson_items: total,
          progress_percentage: pct,
          ...(done && e.status !== "completed"
            ? {
                status: "completed",
                ...(e.completed_at
                  ? {}
                  : { completed_at: new Date().toISOString() }),
              }
            : {}),
        })
        .eq("id", e.id);
    }),
  );
}
