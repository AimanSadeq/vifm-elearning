import { supabaseAdmin } from "@/lib/supabase/admin";
import type {
  AssignmentLessonMeta,
  AssignmentSubmission,
} from "@/types/assignment";

/**
 * Fetch the assignment definition for a lesson. Throws-style returns
 * null when the lesson isn't an assignment or doesn't exist.
 */
export async function getAssignmentMeta(
  lessonId: string,
): Promise<AssignmentLessonMeta | null> {
  const { data } = await supabaseAdmin
    .from("lessons")
    .select(
      "id, course_id, title, title_ar, content_html, content_type, assignment_max_points, assignment_allow_file, assignment_allow_text",
    )
    .eq("id", lessonId)
    .maybeSingle();

  if (!data || data.content_type !== "assignment") return null;

  return {
    lessonId: data.id,
    courseId: data.course_id,
    title: data.title ?? null,
    title_ar: data.title_ar ?? null,
    content_html: data.content_html ?? null,
    assignment_max_points: data.assignment_max_points ?? null,
    assignment_allow_file: Boolean(data.assignment_allow_file),
    assignment_allow_text: Boolean(data.assignment_allow_text),
  };
}

export async function getUserSubmission(
  userId: string,
  lessonId: string,
): Promise<AssignmentSubmission | null> {
  const { data } = await supabaseAdmin
    .from("assignment_submissions")
    .select("*")
    .eq("lesson_id", lessonId)
    .eq("user_id", userId)
    .maybeSingle();
  return (data as AssignmentSubmission | null) ?? null;
}

/**
 * Insert or update the learner's submission. Mirrors the survey
 * upsert pattern: first submission stamps submitted_at (immutable),
 * subsequent edits bump updated_at.
 *
 * Editable while status is 'submitted' (pre-grading) or 'needs_revision'
 * (admin asked for changes). When updating a needs_revision row, status
 * flips back to 'submitted' so it re-enters the review queue and the
 * previous grade is cleared (a fresh review).
 *
 * Locked once status === 'graded'.
 */
export async function upsertSubmission(opts: {
  userId: string;
  lessonId: string;
  courseId: string;
  enrollmentId?: string | null;
  textResponse?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
}): Promise<
  | { ok: true; data: AssignmentSubmission }
  | { ok: false; error: string; status?: number }
> {
  const existing = await getUserSubmission(opts.userId, opts.lessonId);

  if (existing && existing.status === "graded") {
    return {
      ok: false,
      error: "Submission is already graded cannot edit.",
      status: 409,
    };
  }

  if (existing) {
    const wasRevision = existing.status === "needs_revision";
    const { data, error } = await supabaseAdmin
      .from("assignment_submissions")
      .update({
        text_response: opts.textResponse ?? null,
        file_url: opts.fileUrl ?? null,
        file_name: opts.fileName ?? null,
        file_size: opts.fileSize ?? null,
        updated_at: new Date().toISOString(),
        // If the learner is resubmitting after "needs revision", flip
        // back to 'submitted' and clear the prior grade/feedback so the
        // reviewer sees a fresh entry in the queue.
        ...(wasRevision
          ? {
              status: "submitted",
              grade: null,
              feedback: null,
              graded_by: null,
              graded_at: null,
            }
          : {}),
      })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data as AssignmentSubmission };
  }

  const { data, error } = await supabaseAdmin
    .from("assignment_submissions")
    .insert({
      lesson_id: opts.lessonId,
      course_id: opts.courseId,
      user_id: opts.userId,
      enrollment_id: opts.enrollmentId ?? null,
      text_response: opts.textResponse ?? null,
      file_url: opts.fileUrl ?? null,
      file_name: opts.fileName ?? null,
      file_size: opts.fileSize ?? null,
      status: "submitted",
    })
    .select("*")
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as AssignmentSubmission };
}

export async function gradeSubmission(opts: {
  submissionId: string;
  graderId: string;
  grade: number | null;
  feedback: string | null;
  status?: "graded" | "needs_revision";
}): Promise<
  | { ok: true; data: AssignmentSubmission }
  | { ok: false; error: string }
> {
  const { data, error } = await supabaseAdmin
    .from("assignment_submissions")
    .update({
      grade: opts.grade,
      feedback: opts.feedback,
      status: opts.status ?? "graded",
      graded_by: opts.graderId,
      graded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", opts.submissionId)
    .select("*")
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as AssignmentSubmission };
}
