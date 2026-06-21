-- Rename difficulty values to match the new labels:
--   beginner -> gateway, intermediate -> professional, advanced -> executive
-- (expert unchanged). Existing rows are preserved/migrated. Idempotent.

-- courses.difficulty_level is the `difficulty_level` ENUM. Renaming a value
-- keeps every existing row intact (enum is stored by id, not text).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid
             WHERE t.typname = 'difficulty_level' AND e.enumlabel = 'beginner') THEN
    ALTER TYPE difficulty_level RENAME VALUE 'beginner' TO 'gateway';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid
             WHERE t.typname = 'difficulty_level' AND e.enumlabel = 'intermediate') THEN
    ALTER TYPE difficulty_level RENAME VALUE 'intermediate' TO 'professional';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid
             WHERE t.typname = 'difficulty_level' AND e.enumlabel = 'advanced') THEN
    ALTER TYPE difficulty_level RENAME VALUE 'advanced' TO 'executive';
  END IF;
END$$;

-- The column default referenced the old label — point it at the new one.
ALTER TABLE courses ALTER COLUMN difficulty_level SET DEFAULT 'gateway';

-- learning_paths.difficulty_level is a TEXT column guarded by a CHECK. Drop the
-- constraint first (the UPDATEs would otherwise violate the old allow-list),
-- migrate the data, then re-add the constraint with the new values.
ALTER TABLE learning_paths DROP CONSTRAINT IF EXISTS learning_paths_difficulty_level_check;
ALTER TABLE learning_paths ALTER COLUMN difficulty_level DROP DEFAULT;

UPDATE learning_paths SET difficulty_level = 'gateway'      WHERE difficulty_level = 'beginner';
UPDATE learning_paths SET difficulty_level = 'professional' WHERE difficulty_level = 'intermediate';
UPDATE learning_paths SET difficulty_level = 'executive'    WHERE difficulty_level = 'advanced';

ALTER TABLE learning_paths
  ADD CONSTRAINT learning_paths_difficulty_level_check
  CHECK (difficulty_level IN ('gateway', 'professional', 'executive', 'expert'));
ALTER TABLE learning_paths ALTER COLUMN difficulty_level SET DEFAULT 'gateway';
