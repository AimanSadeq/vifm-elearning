-- ============================================================================
-- Phase 4: Schema Alignment Migration
-- Adds bilingual columns and Phase 4 feature fields to existing tables
-- ============================================================================

-- profiles: add bilingual name
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name_ar TEXT;

-- organizations: add bilingual + corporate management fields
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS name_ar TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS license_type TEXT DEFAULT 'per_seat';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS max_seats INTEGER DEFAULT 0;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS license_start_date TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS license_end_date TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- webinars: add bilingual + category + recording + pricing fields
ALTER TABLE webinars ADD COLUMN IF NOT EXISTS title_ar TEXT;
ALTER TABLE webinars ADD COLUMN IF NOT EXISTS description_ar TEXT;
ALTER TABLE webinars ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id);
ALTER TABLE webinars ADD COLUMN IF NOT EXISTS is_recording_public BOOLEAN DEFAULT false;
ALTER TABLE webinars ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
ALTER TABLE webinars ADD COLUMN IF NOT EXISTS tags TEXT[];

-- forum_posts: add bilingual + instructor answer + reply count + lesson ref
ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS title_ar TEXT;
ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS content_ar TEXT;
ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS is_instructor_answer BOOLEAN DEFAULT false;
ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS reply_count INTEGER DEFAULT 0;
ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS lesson_id UUID REFERENCES lessons(id);

-- notifications: add bilingual fields
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title_ar TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS body_ar TEXT;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
