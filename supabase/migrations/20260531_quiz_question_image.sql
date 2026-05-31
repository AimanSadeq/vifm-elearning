-- Quiz question images
-- Adds an optional image that is displayed below the question text in both the
-- admin editor and the learner-facing quiz player. Images are stored in the
-- public `course-assets` storage bucket; this column holds their public URL.

ALTER TABLE quiz_questions
  ADD COLUMN IF NOT EXISTS image_url TEXT;
