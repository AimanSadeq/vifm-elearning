-- ============================================================
-- site_settings: a small key/value store for editable site content
-- (office locations, support email, etc.) that non-engineers should
-- be able to change through an admin UI without a code deploy.
-- ============================================================

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Everyone (including anon) can read site settings.
DROP POLICY IF EXISTS "site_settings_read_all" ON site_settings;
CREATE POLICY "site_settings_read_all"
  ON site_settings FOR SELECT
  USING (true);

-- Only super_admin profiles can insert/update/delete.
DROP POLICY IF EXISTS "site_settings_admin_write" ON site_settings;
CREATE POLICY "site_settings_admin_write"
  ON site_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
    )
  );

-- Seed initial values.
INSERT INTO site_settings (key, value, description) VALUES
  (
    'offices',
    '[
      {
        "key": "dubai",
        "city": "Dubai, UAE",
        "cityAr": "دبي، الإمارات",
        "address": "DIFC, Gate Village Building 3",
        "addressAr": "مركز دبي المالي العالمي، مبنى بوابة القرية ٣",
        "phone": "+971 4 123 4567",
        "email": "dubai@vifm.academy"
      },
      {
        "key": "riyadh",
        "city": "Riyadh, KSA",
        "cityAr": "الرياض، المملكة العربية السعودية",
        "address": "King Fahd Road, Olaya District",
        "addressAr": "طريق الملك فهد، حي العليا",
        "phone": "+966 11 234 5678",
        "email": "riyadh@vifm.academy"
      },
      {
        "key": "virginia",
        "city": "Virginia, USA",
        "cityAr": "فيرجينيا، الولايات المتحدة",
        "address": "Tysons Corner Center",
        "addressAr": "مركز تايسونز كورنر",
        "phone": "+1 703 555 0123",
        "email": "info@vifm.academy"
      }
    ]'::jsonb,
    'Office locations shown on /about and /contact pages'
  ),
  (
    'support_email',
    '"membership@viftraining.com"'::jsonb,
    'Primary support email address shown on designation FAQ pages'
  )
ON CONFLICT (key) DO NOTHING;
