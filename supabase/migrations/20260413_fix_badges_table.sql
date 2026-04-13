-- =============================================================================
-- FIX BADGES TABLE
-- Creates badges table if missing and aligns schema with admin UI which sends
-- name, name_ar, description, description_ar, icon_url, criteria (text), is_active.
-- =============================================================================

CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    name_ar TEXT,
    description TEXT,
    description_ar TEXT,
    icon_url TEXT,
    criteria TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE badges ADD COLUMN IF NOT EXISTS name_ar TEXT;
ALTER TABLE badges ADD COLUMN IF NOT EXISTS description_ar TEXT;
ALTER TABLE badges ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- If an older install has criteria as JSONB, convert it to TEXT to match the UI input.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'badges' AND column_name = 'criteria' AND data_type = 'jsonb'
    ) THEN
        ALTER TABLE badges ALTER COLUMN criteria TYPE TEXT USING criteria::TEXT;
    END IF;
END $$;

-- Older schema had slug UNIQUE NOT NULL. The admin UI doesn't provide one, so
-- drop the NOT NULL constraint if it exists.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'badges' AND column_name = 'slug' AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE badges ALTER COLUMN slug DROP NOT NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_badges_is_active ON badges(is_active);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS badges_select_all ON badges;
CREATE POLICY badges_select_all ON badges
    FOR SELECT USING (true);

DROP POLICY IF EXISTS badges_all_admin ON badges;
CREATE POLICY badges_all_admin ON badges
    FOR ALL USING (is_admin());

DROP TRIGGER IF EXISTS trg_badges_updated_at ON badges;
CREATE TRIGGER trg_badges_updated_at
    BEFORE UPDATE ON badges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
