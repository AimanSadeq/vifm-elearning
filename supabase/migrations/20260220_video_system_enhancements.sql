-- Video System Enhancements Migration
-- Run in Supabase SQL Editor

-- 1. Add new columns to lesson_progress
ALTER TABLE lesson_progress
  ADD COLUMN IF NOT EXISTS total_watch_time_seconds INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_progress_seconds INTEGER DEFAULT 0;

-- 2. Add caption URLs to lessons
ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS captions_en_url TEXT,
  ADD COLUMN IF NOT EXISTS captions_ar_url TEXT;

-- 3. Add sequential locking to courses
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS sequential_locking_enabled BOOLEAN DEFAULT false;

-- 4. Create lesson_bookmarks table
CREATE TABLE IF NOT EXISTS lesson_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  timestamp_seconds INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  bookmark_type TEXT NOT NULL DEFAULT 'note' CHECK (bookmark_type IN ('note', 'highlight', 'question', 'important')),
  color TEXT NOT NULL DEFAULT 'yellow' CHECK (color IN ('yellow', 'blue', 'green', 'pink', 'orange')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lesson_bookmarks_user_lesson ON lesson_bookmarks(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_bookmarks_course ON lesson_bookmarks(course_id);

-- 5. Create watch_statistics table
CREATE TABLE IF NOT EXISTS watch_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  total_watch_time_seconds INTEGER DEFAULT 0,
  play_count INTEGER DEFAULT 0,
  pause_count INTEGER DEFAULT 0,
  seek_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_watch_statistics_user ON watch_statistics(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_statistics_course ON watch_statistics(course_id);

-- 6. RLS Policies for lesson_bookmarks
ALTER TABLE lesson_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bookmarks"
  ON lesson_bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookmarks"
  ON lesson_bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookmarks"
  ON lesson_bookmarks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks"
  ON lesson_bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- 7. RLS Policies for watch_statistics
ALTER TABLE watch_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own watch statistics"
  ON watch_statistics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own watch statistics"
  ON watch_statistics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own watch statistics"
  ON watch_statistics FOR UPDATE
  USING (auth.uid() = user_id);

-- 8. Updated_at trigger for new tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lesson_bookmarks_updated_at
  BEFORE UPDATE ON lesson_bookmarks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_watch_statistics_updated_at
  BEFORE UPDATE ON watch_statistics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
