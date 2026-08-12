-- ============================================================================
-- Follow-up (Kirkpatrick Level 3) surveys
--
-- Adds a survey kind to course_surveys so each course can carry TWO surveys:
--   completion : the existing post-completion survey (cert/badge gate)
--   followup   : a behavior-application survey sent ~90 days after a training
--                assignment is completed, via the training-followups cron
--
-- training_assignments.followup_sent_at records when the invitation went out
-- so the cron never double-sends.
-- ============================================================================

ALTER TABLE course_surveys
    ADD COLUMN IF NOT EXISTS survey_kind TEXT NOT NULL DEFAULT 'completion'
    CHECK (survey_kind IN ('completion', 'followup'));

-- One survey per course per kind (was: one per course).
ALTER TABLE course_surveys
    DROP CONSTRAINT IF EXISTS course_surveys_course_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS uq_course_surveys_course_kind
    ON course_surveys(course_id, survey_kind);

CREATE INDEX IF NOT EXISTS idx_course_surveys_kind
    ON course_surveys(survey_kind);

ALTER TABLE training_assignments
    ADD COLUMN IF NOT EXISTS followup_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_training_assignments_followup
    ON training_assignments(status, completed_at)
    WHERE status = 'completed' AND followup_sent_at IS NULL;

COMMENT ON COLUMN course_surveys.survey_kind IS
  'completion = post-course survey (gates cert/badge). followup = Kirkpatrick L3 behavior survey sent ~90 days after assignment completion.';
COMMENT ON COLUMN training_assignments.followup_sent_at IS
  'When the follow-up survey invitation was sent. NULL = not yet sent.';
