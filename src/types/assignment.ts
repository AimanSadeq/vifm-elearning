export type AssignmentSubmissionStatus =
  | "submitted"
  | "graded"
  | "needs_revision";

export interface AssignmentLessonMeta {
  lessonId: string;
  courseId: string;
  title: string | null;
  title_ar: string | null;
  content_html: string | null;
  assignment_max_points: number | null;
  assignment_allow_file: boolean;
  assignment_allow_text: boolean;
}

export interface AssignmentSubmission {
  id: string;
  lesson_id: string;
  course_id: string;
  user_id: string;
  enrollment_id: string | null;
  text_response: string | null;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  status: AssignmentSubmissionStatus;
  grade: number | null;
  feedback: string | null;
  graded_by: string | null;
  graded_at: string | null;
  submitted_at: string;
  updated_at: string;
}

export interface AdminSubmissionRow extends AssignmentSubmission {
  user: { full_name: string | null; email: string } | null;
  lesson: {
    title: string | null;
    assignment_max_points: number | null;
  } | null;
  course: { title: string | null; slug: string | null } | null;
}
