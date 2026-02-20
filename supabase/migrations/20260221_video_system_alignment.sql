-- Video System Alignment Migration
-- Aligns eLearning portal video system with the bank compliance platform architecture.
-- Run in Supabase SQL Editor.

-- ============================================================
-- 1. lessons table — per-lesson video configuration
-- ============================================================
ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS force_watch_first BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS allow_speed_control BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_download BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS minimum_watch_percentage INTEGER DEFAULT 90,
  ADD COLUMN IF NOT EXISTS allow_skipping BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_save_interval_seconds INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- ============================================================
-- 2. lesson_progress table — granular tracking fields
-- ============================================================
ALTER TABLE lesson_progress
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS video_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS first_viewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS watched_segments JSONB DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS total_watch_time_delta_accumulated REAL DEFAULT 0;

-- ============================================================
-- 3. lesson_bookmarks table — extended fields
-- ============================================================
ALTER TABLE lesson_bookmarks
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS page_number INTEGER,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::JSONB;

-- ============================================================
-- 4. enrollments table — aggregation fields
-- ============================================================
ALTER TABLE enrollments
  ADD COLUMN IF NOT EXISTS completed_lesson_ids UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS total_lesson_items INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_lesson_items INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_time_spent_seconds REAL DEFAULT 0;

-- ============================================================
-- 5. course-videos Supabase Storage bucket
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-videos',
  'course-videos',
  false,
  5368709120, -- 5 GB
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'application/x-mpegURL', 'video/MP2T']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for course-videos bucket
CREATE POLICY "Authenticated users can read course videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'course-videos' AND auth.role() = 'authenticated');

CREATE POLICY "Service role can upload course videos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'course-videos' AND auth.role() = 'service_role');

CREATE POLICY "Service role can update course videos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'course-videos' AND auth.role() = 'service_role');

CREATE POLICY "Service role can delete course videos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'course-videos' AND auth.role() = 'service_role');

-- ============================================================
-- 6. Indexes for new columns
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_lessons_is_active ON lessons(is_active);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_video_completed ON lesson_progress(video_completed);
CREATE INDEX IF NOT EXISTS idx_enrollments_completed_items ON enrollments(completed_lesson_items);
