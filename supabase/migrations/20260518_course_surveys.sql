-- ============================================================
-- Course Surveys
--
-- A survey is shown to learners after course completion and gates
-- access to the certificate + badge until the first submission.
-- Each course has at most one survey (UNIQUE course_id).
--
-- Question types (v1):
--   - rating         : integer 1..5
--   - multiple_choice: index into options[] (string)
--   - free_text      : freeform text
--   - nps            : integer 0..10 with optional reason follow-up
--                      (follow-up label lives in options.follow_up_text*)
--
-- Responses are UPSERTed on (survey_id, user_id) — learner can edit
-- their answers any time. edit_count tracks edits; submitted_at is
-- the first-submit timestamp (immutable, this is what unblocks the
-- certificate/badge); updated_at is the last edit.
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'survey_question_type') THEN
    CREATE TYPE survey_question_type AS ENUM
      ('rating', 'multiple_choice', 'free_text', 'nps');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS course_surveys (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id    UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title        TEXT,
  title_ar     TEXT,
  description  TEXT,
  description_ar TEXT,
  is_required  BOOLEAN NOT NULL DEFAULT true,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (course_id)
);

CREATE TABLE IF NOT EXISTS survey_questions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id        UUID NOT NULL REFERENCES course_surveys(id) ON DELETE CASCADE,
  question_text    TEXT NOT NULL,
  question_text_ar TEXT,
  question_type    survey_question_type NOT NULL,
  options          JSONB,
  is_required      BOOLEAN NOT NULL DEFAULT true,
  sort_order       INT NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS survey_responses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id     UUID NOT NULL REFERENCES course_surveys(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE SET NULL,
  answers       JSONB NOT NULL,
  edit_count    INT NOT NULL DEFAULT 0,
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (survey_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_survey_questions_survey
  ON survey_questions (survey_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey
  ON survey_responses (survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_user
  ON survey_responses (user_id);

COMMENT ON TABLE course_surveys IS
  'One survey per course. Blocks certificate/badge until submitted when is_required = true.';
COMMENT ON COLUMN survey_questions.options IS
  'multiple_choice: { choices: [{label, label_ar}, ...] }. nps: { follow_up_text, follow_up_text_ar }.';
COMMENT ON COLUMN survey_responses.answers IS
  'Map of question_id -> answer value. Shape per question_type: rating=1..5, multiple_choice=string-or-index, free_text=string, nps={ score, reason }.';
COMMENT ON COLUMN survey_responses.submitted_at IS
  'First-submit timestamp (immutable). This is the value that unblocks the cert/badge gate. updated_at tracks subsequent edits.';

-- RLS — admin via service role bypasses everything; learners read their
-- own responses + active surveys of courses they are enrolled in.
ALTER TABLE course_surveys      ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_questions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses    ENABLE ROW LEVEL SECURITY;

-- Active surveys + their questions are readable by any signed-in user
-- (learners need to fetch the survey to answer it; visibility of the
-- existence of a survey isn't sensitive).
DROP POLICY IF EXISTS "Read active surveys" ON course_surveys;
CREATE POLICY "Read active surveys" ON course_surveys
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Read questions of active surveys" ON survey_questions;
CREATE POLICY "Read questions of active surveys" ON survey_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM course_surveys cs
      WHERE cs.id = survey_questions.survey_id AND cs.is_active = true
    )
  );

DROP POLICY IF EXISTS "Read own responses" ON survey_responses;
CREATE POLICY "Read own responses" ON survey_responses
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Insert own responses" ON survey_responses;
CREATE POLICY "Insert own responses" ON survey_responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Update own responses" ON survey_responses;
CREATE POLICY "Update own responses" ON survey_responses
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
