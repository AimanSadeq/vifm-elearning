-- ============================================================
-- Per-course tier (Gateway / Professional / Executive). Mirrors the
-- existing `designations.metadata.tier_level` so a course can be
-- classified independently of any designation it belongs to.
-- NULL means "untiered" — admin hasn't decided yet.
-- ============================================================

ALTER TABLE courses ADD COLUMN IF NOT EXISTS tier_level text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'courses' AND constraint_name = 'courses_tier_level_check'
  ) THEN
    ALTER TABLE courses
      ADD CONSTRAINT courses_tier_level_check
      CHECK (tier_level IS NULL OR tier_level IN ('gateway', 'professional', 'executive'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_courses_tier_level ON courses(tier_level);

COMMENT ON COLUMN courses.tier_level IS
  'Course tier — gateway / professional / executive / NULL. Editable from /admin/courses/<id>/edit.';
