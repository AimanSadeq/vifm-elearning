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
