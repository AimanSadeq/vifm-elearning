-- ============================================================
-- Per-template placeholder substitution map. The bundled / admin-uploaded
-- .pptx may use any `{{TOKEN}}` set; this column lets admins map static
-- tokens (CITY, COUNTRY, CLIENT_NAME, custom org-specific ones, …) to
-- values without editing the .pptx itself. Dynamic tokens
-- (ATTENDEE_NAME / COURSE_TITLE / DATE_RANGE / CODE) are filled from the
-- learner / certificate record at generation time and override anything in
-- this column.
-- ============================================================

ALTER TABLE certificate_templates
  ADD COLUMN IF NOT EXISTS placeholder_values jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN certificate_templates.placeholder_values IS
  'Static placeholder substitution map (e.g. { "CITY": "Riyadh", "INSTRUCTOR_NAME": "Dr Smith" }). Dynamic tokens are not stored here — they come from the learner/cert record.';
