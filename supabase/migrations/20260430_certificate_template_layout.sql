-- ============================================================
-- Certificate templates can carry either:
--   - a JSON `layout` edited via the admin certificate editor
--   - or an uploaded `.pptx` file path in Supabase Storage
-- Both NULL = fall back to the bundled default (vifm-classic.pptx).
-- The .pptx upload takes precedence over the JSON layout when both are set.
-- ============================================================

ALTER TABLE certificate_templates
  ADD COLUMN IF NOT EXISTS layout jsonb;

ALTER TABLE certificate_templates
  ADD COLUMN IF NOT EXISTS pptx_path text;

COMMENT ON COLUMN certificate_templates.layout IS
  'JSON layout produced by the admin certificate editor. Each element has type/x/y plus type-specific fields. NULL = use bundled default unless pptx_path is set.';

COMMENT ON COLUMN certificate_templates.pptx_path IS
  'Storage path (in the `certificates` bucket) of an uploaded .pptx template. Takes precedence over `layout`. NULL = use layout / bundled default.';
