-- ============================================================================
-- Phase 3: Assessments, Certificates & Payments — Schema Additions
-- ============================================================================
-- Adds missing columns expected by TypeScript types that were not in 001.

-- quizzes: bilingual fields, final exam flag, sort order
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS title_ar TEXT;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS description_ar TEXT;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS is_final_exam BOOLEAN DEFAULT false;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- quiz_questions: bilingual fields, metadata
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS question_text_ar TEXT;
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS explanation_ar TEXT;
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- quiz_options: bilingual field
ALTER TABLE quiz_options ADD COLUMN IF NOT EXISTS option_text_ar TEXT;

-- certificates: verification_code for public verification
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS verification_code TEXT UNIQUE DEFAULT uuid_generate_v4()::TEXT;

-- Prevent duplicate certificates per user+course
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'certificates_user_course_unique'
    ) THEN
        ALTER TABLE certificates ADD CONSTRAINT certificates_user_course_unique UNIQUE (user_id, course_id);
    END IF;
END$$;
