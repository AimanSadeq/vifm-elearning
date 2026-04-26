-- ============================================================
-- Allow Arabic-only courses (or English-only). Previously the
-- English `title` was required (NOT NULL) which forced admins to
-- fill it even when authoring an Arabic course. Now either field
-- may be the primary title, but at least one must be present.
-- ============================================================

ALTER TABLE courses ALTER COLUMN title DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'courses'
      AND constraint_name = 'courses_title_or_title_ar_required'
  ) THEN
    ALTER TABLE courses
      ADD CONSTRAINT courses_title_or_title_ar_required
      CHECK (
        (title IS NOT NULL AND length(btrim(title)) > 0) OR
        (title_ar IS NOT NULL AND length(btrim(title_ar)) > 0)
      );
  END IF;
END $$;
