-- ============================================================
-- Mirror of 20260424_courses_bilingual_title.sql for modules and
-- lessons: allow Arabic-only or English-only entries, but require
-- that at least one localized title is present.
-- ============================================================

ALTER TABLE modules ALTER COLUMN title DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'modules'
      AND constraint_name = 'modules_title_or_title_ar_required'
  ) THEN
    ALTER TABLE modules
      ADD CONSTRAINT modules_title_or_title_ar_required
      CHECK (
        (title IS NOT NULL AND length(btrim(title)) > 0) OR
        (title_ar IS NOT NULL AND length(btrim(title_ar)) > 0)
      );
  END IF;
END $$;

ALTER TABLE lessons ALTER COLUMN title DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'lessons'
      AND constraint_name = 'lessons_title_or_title_ar_required'
  ) THEN
    ALTER TABLE lessons
      ADD CONSTRAINT lessons_title_or_title_ar_required
      CHECK (
        (title IS NOT NULL AND length(btrim(title)) > 0) OR
        (title_ar IS NOT NULL AND length(btrim(title_ar)) > 0)
      );
  END IF;
END $$;
