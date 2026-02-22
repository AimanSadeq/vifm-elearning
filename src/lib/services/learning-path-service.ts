import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Calculate and update a user's progress through a learning path.
 *
 * Progress is based on the percentage of *required* courses that the user
 * has completed (enrollment status = "completed"). Optional courses do not
 * affect the overall completion percentage.
 *
 * If all required courses are completed the enrollment is marked "completed".
 */
export async function calculateLearningPathProgress(
  supabase: SupabaseClient,
  userId: string,
  pathId: string
): Promise<{ progress: number; status: "active" | "completed" }> {
  // 1. Fetch all courses in the learning path
  const { data: pathCourses } = await supabase
    .from("learning_path_courses")
    .select("course_id, is_required")
    .eq("learning_path_id", pathId)
    .order("sort_order");

  if (!pathCourses || pathCourses.length === 0) {
    return { progress: 0, status: "active" };
  }

  // 2. Get the user's enrollments for those courses
  const courseIds = pathCourses.map((c) => c.course_id);
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("course_id, status")
    .eq("user_id", userId)
    .in("course_id", courseIds);

  const enrollmentMap = new Map(
    (enrollments ?? []).map((e) => [e.course_id, e.status])
  );

  // 3. Count required courses and how many are completed
  const requiredCourses = pathCourses.filter((c) => c.is_required);
  const totalRequired = requiredCourses.length;

  if (totalRequired === 0) {
    // If no courses are required, completion = 100% if any course is done
    const anyCompleted = pathCourses.some(
      (c) => enrollmentMap.get(c.course_id) === "completed"
    );
    const progress = anyCompleted ? 100 : 0;
    const status = anyCompleted ? "completed" : "active";

    await updateEnrollment(supabase, userId, pathId, progress, status);
    return { progress, status };
  }

  const completedRequired = requiredCourses.filter(
    (c) => enrollmentMap.get(c.course_id) === "completed"
  ).length;

  const progress = Math.round((completedRequired / totalRequired) * 100);
  const status: "active" | "completed" =
    completedRequired >= totalRequired ? "completed" : "active";

  // 4. Update the enrollment record
  await updateEnrollment(supabase, userId, pathId, progress, status);

  return { progress, status };
}

async function updateEnrollment(
  supabase: SupabaseClient,
  userId: string,
  pathId: string,
  progress: number,
  status: "active" | "completed"
) {
  const updateData: Record<string, unknown> = { progress, status };

  if (status === "completed") {
    updateData.completed_at = new Date().toISOString();
  }

  await supabase
    .from("learning_path_enrollments")
    .update(updateData)
    .eq("user_id", userId)
    .eq("learning_path_id", pathId);
}

/**
 * Recalculate progress for all active learning path enrollments of a user.
 * Call this when a course enrollment status changes (e.g. course completed).
 */
export async function recalculateAllPathsForUser(
  supabase: SupabaseClient,
  userId: string
) {
  const { data: enrollments } = await supabase
    .from("learning_path_enrollments")
    .select("learning_path_id")
    .eq("user_id", userId)
    .eq("status", "active");

  if (!enrollments || enrollments.length === 0) return;

  await Promise.all(
    enrollments.map((e) =>
      calculateLearningPathProgress(supabase, userId, e.learning_path_id)
    )
  );
}
