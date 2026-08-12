-- ============================================================================
-- Impact (Kirkpatrick Level 4) surveys
--
-- Adds a third survey kind so each course can carry THREE surveys:
--   completion : post-completion reaction survey (L1, cert/badge gate)
--   followup   : behavior-application survey ~90 days after assignment
--                completion (L3)
--   impact     : business-results survey ~180 days after assignment
--                completion (L4), sent via the same training-followups cron
--
-- training_assignments.impact_sent_at records when the L4 invitation went
-- out so the cron never double-sends (mirrors followup_sent_at).
-- ============================================================================

ALTER TABLE course_surveys
    DROP CONSTRAINT IF EXISTS course_surveys_survey_kind_check;

ALTER TABLE course_surveys
    ADD CONSTRAINT course_surveys_survey_kind_check
    CHECK (survey_kind IN ('completion', 'followup', 'impact'));

ALTER TABLE training_assignments
    ADD COLUMN IF NOT EXISTS impact_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_training_assignments_impact
    ON training_assignments(status, completed_at)
    WHERE status = 'completed' AND impact_sent_at IS NULL;

COMMENT ON COLUMN course_surveys.survey_kind IS
  'completion = post-course survey (gates cert/badge). followup = Kirkpatrick L3 behavior survey (~90 days). impact = Kirkpatrick L4 results survey (~180 days).';
COMMENT ON COLUMN training_assignments.impact_sent_at IS
  'When the impact (L4) survey invitation was sent. NULL = not yet sent.';
