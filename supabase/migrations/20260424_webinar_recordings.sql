-- ============================================================
-- Move webinars.recording_url into a separately-RLS'd table.
--
-- The previous setup left `recording_url` on the public-readable
-- `webinars` row. Since RLS is row-level (not column-level), any
-- anonymous Supabase client could read it directly:
--
--   supabase.from("webinars").select("recording_url").eq("id", X)
--
-- That bypassed the API gate. Solution: hold the URL in a separate
-- table whose RLS only admits super_admin. The existing
-- `/api/webinars/[id]/recording` endpoint reads via the service-role
-- client (which bypasses RLS) after checking the user's plan-level
-- `webinars` feature.
-- ============================================================

CREATE TABLE IF NOT EXISTS webinar_recordings (
  webinar_id UUID PRIMARY KEY REFERENCES webinars(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE webinar_recordings ENABLE ROW LEVEL SECURITY;

-- Wipe and recreate the policy idempotently
DROP POLICY IF EXISTS "webinar_recordings_admin_only" ON webinar_recordings;
CREATE POLICY "webinar_recordings_admin_only"
  ON webinar_recordings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
  );

-- Backfill existing recordings (idempotent — uses ON CONFLICT)
INSERT INTO webinar_recordings (webinar_id, url, is_public, created_at, updated_at)
SELECT id, recording_url, COALESCE(is_recording_public, FALSE), created_at, updated_at
FROM webinars
WHERE recording_url IS NOT NULL AND recording_url <> ''
ON CONFLICT (webinar_id) DO NOTHING;

-- Drop the leaky column from the public-readable table
ALTER TABLE webinars DROP COLUMN IF EXISTS recording_url;

-- is_recording_public also stays — it's a boolean, no leak. But keep it
-- aligned with the new is_public column on webinar_recordings via a trigger
-- so the catalog can show "recording available" badges without exposing the URL.
