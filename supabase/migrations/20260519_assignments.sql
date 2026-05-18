-- ============================================================
-- Assignment lessons.
--
-- An assignment is a lesson where the learner submits work (file
-- and/or text) and an admin/instructor grades it manually. The
-- `assignment` value already exists in the lessons.content_type
-- enum (since 001_initial_schema.sql) but until now there was no
-- UI or schema to back it.
--
-- Design:
--   - Assignment metadata lives on lessons (same pattern as video).
--     Instructions text is reused from lessons.content_html.
--   - One row per (lesson, user) in assignment_submissions —
--     learner can update their work until graded.
--   - First submission marks the lesson complete (Option 1 from the
--     plan: "submit = complete"). Grading is for feedback/score and
--     does NOT block course progression.
-- ============================================================

ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS assignment_max_points  INTEGER,
  ADD COLUMN IF NOT EXISTS assignment_allow_file  BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS assignment_allow_text  BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN lessons.assignment_max_points IS
  'Max points awarded on this assignment. NULL = ungraded (feedback only).';
COMMENT ON COLUMN lessons.assignment_allow_file IS
  'Whether the learner can upload a file. At least one of allow_file/allow_text must be true.';
COMMENT ON COLUMN lessons.assignment_allow_text IS
  'Whether the learner can type a free-text response.';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assignment_submission_status') THEN
    CREATE TYPE assignment_submission_status AS ENUM
      ('submitted', 'graded', 'needs_revision');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS assignment_submissions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id      UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  course_id      UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  enrollment_id  UUID REFERENCES enrollments(id) ON DELETE SET NULL,

  -- Submission payload
  text_response  TEXT,
  file_url       TEXT,     -- path inside `assignment-submissions` bucket
  file_name      TEXT,
  file_size      BIGINT,

  -- Status + grading
  status         assignment_submission_status NOT NULL DEFAULT 'submitted',
  grade          INTEGER,  -- points; NULL = ungraded
  feedback       TEXT,
  graded_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  graded_at      TIMESTAMPTZ,

  submitted_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (lesson_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_assignment_submissions_lesson
  ON assignment_submissions (lesson_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_user
  ON assignment_submissions (user_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_course
  ON assignment_submissions (course_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_pending
  ON assignment_submissions (course_id, submitted_at DESC)
  WHERE status = 'submitted';

COMMENT ON COLUMN assignment_submissions.submitted_at IS
  'First-submit timestamp (immutable). Re-submissions before grading update updated_at, not this.';

-- ============================================================
-- Storage bucket for submission files (private)
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assignment-submissions',
  'assignment-submissions',
  false,
  104857600, -- 100 MB per file
  NULL       -- any mime type, validated at the API layer
)
ON CONFLICT (id) DO NOTHING;

-- Owners can read their own files. Admins go through service role
-- (which bypasses RLS) so no special policy needed for review.
DROP POLICY IF EXISTS "Learners read own assignment files" ON storage.objects;
CREATE POLICY "Learners read own assignment files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'assignment-submissions'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Learners upload own assignment files" ON storage.objects;
CREATE POLICY "Learners upload own assignment files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'assignment-submissions'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Learners update own assignment files" ON storage.objects;
CREATE POLICY "Learners update own assignment files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'assignment-submissions'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Learners delete own assignment files" ON storage.objects;
CREATE POLICY "Learners delete own assignment files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'assignment-submissions'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- RLS on assignment_submissions
-- ============================================================
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read own submissions" ON assignment_submissions;
CREATE POLICY "Read own submissions" ON assignment_submissions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Insert own submissions" ON assignment_submissions;
CREATE POLICY "Insert own submissions" ON assignment_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Update own submissions before grading" ON assignment_submissions;
CREATE POLICY "Update own submissions before grading" ON assignment_submissions
  FOR UPDATE
  USING (auth.uid() = user_id AND status = 'submitted')
  WITH CHECK (auth.uid() = user_id AND status = 'submitted');
