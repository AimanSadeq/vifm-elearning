-- Knowledge-check certificate gate.
--
-- A course can require that the learner has attempted every published quiz
-- ("knowledge check") and cleared courses.passing_score on the weighted
-- aggregate before its certificate is issued. courses.passing_score already
-- existed and was displayed on the course page but gated nothing; this makes
-- it the aggregate pass mark.
--
-- Default ON: courses with no published quizzes are unaffected either way
-- (the gate short-circuits), so this only takes effect where checks exist.

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS require_knowledge_checks BOOLEAN DEFAULT true;

UPDATE courses
SET require_knowledge_checks = true
WHERE require_knowledge_checks IS NULL;

-- The summary reads every completed attempt a learner has for a course's
-- quizzes; this is the access path.
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_quiz_completed
  ON quiz_attempts (user_id, quiz_id)
  WHERE completed_at IS NOT NULL;
