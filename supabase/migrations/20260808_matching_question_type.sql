-- Matching / drag-to-pair question type.
--
-- A matching question stores one quiz_options row PER PAIR:
--   option_text  -> the left-hand prompt  ("Current Ratio")
--   match_text   -> its correct partner   ("Current Assets / Current Liabilities")
-- is_correct is always true on these rows; the pairing itself is the answer key.
--
-- The learner is shown the left column in order and the right column shuffled,
-- and drags each right item onto its prompt.
--
-- NOTE: ALTER TYPE ... ADD VALUE cannot be used in the same transaction that
-- references the new value, so run this file on its own.

ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'matching';

ALTER TABLE quiz_options
  ADD COLUMN IF NOT EXISTS match_text TEXT,
  ADD COLUMN IF NOT EXISTS match_text_ar TEXT;

COMMENT ON COLUMN quiz_options.match_text IS
  'Matching questions only: the right-hand item that pairs with option_text.';
