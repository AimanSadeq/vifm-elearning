-- =============================================================================
-- CERTIFICATE TEMPLATES
-- Multiple pre-designed certificate layouts with customizable branding
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Ensure helper functions exist (defined in 001_initial_schema but may
-- not have been applied to the live database)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role = 'super_admin' FROM profiles WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- CERTIFICATE_TEMPLATES TABLE
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS certificate_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    name_ar TEXT,
    template_key TEXT NOT NULL CHECK (template_key IN ('classic', 'modern', 'corporate', 'elegant')),
    primary_color TEXT DEFAULT '#1A3A5F',
    secondary_color TEXT DEFAULT '#D4AF37',
    accent_color TEXT DEFAULT '#646464',
    logo_url TEXT,
    organization_name TEXT DEFAULT 'Virginia Institute of Finance and Management',
    organization_name_ar TEXT DEFAULT '',
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add certificate_template_id to courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS certificate_template_id UUID REFERENCES certificate_templates(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_certificate_templates_template_key ON certificate_templates(template_key);
CREATE INDEX IF NOT EXISTS idx_certificate_templates_is_active ON certificate_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_certificate_templates_is_default ON certificate_templates(is_default);
CREATE INDEX IF NOT EXISTS idx_courses_certificate_template_id ON courses(certificate_template_id);

-- ---------------------------------------------------------------------------
-- TRIGGERS
-- ---------------------------------------------------------------------------
CREATE OR REPLACE TRIGGER trg_certificate_templates_updated_at
    BEFORE UPDATE ON certificate_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------
ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;

-- Admins can manage all templates
CREATE POLICY "Admins can manage certificate templates"
    ON certificate_templates FOR ALL
    USING (is_admin());

-- Anyone authenticated can read active templates (needed for certificate generation)
CREATE POLICY "Authenticated users can read active certificate templates"
    ON certificate_templates FOR SELECT
    USING (is_active = true AND auth.uid() IS NOT NULL);

-- ---------------------------------------------------------------------------
-- SEED: Classic template (matches current hardcoded design)
-- ---------------------------------------------------------------------------
INSERT INTO certificate_templates (name, name_ar, template_key, primary_color, secondary_color, accent_color, organization_name, organization_name_ar, is_default)
VALUES (
    'Classic VIFM',
    'VIFM كلاسيكي',
    'classic',
    '#1A3A5F',
    '#D4AF37',
    '#646464',
    'Virginia Institute of Finance and Management',
    'معهد فرجينيا للتمويل والإدارة',
    true
);
