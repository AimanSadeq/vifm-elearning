-- Add designation_id column to courses table for linking designations to courses
-- This allows each designation to have an associated course for video/content management

ALTER TABLE courses ADD COLUMN IF NOT EXISTS designation_id UUID REFERENCES designations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_courses_designation_id ON courses(designation_id);
