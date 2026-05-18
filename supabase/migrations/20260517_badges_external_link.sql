-- ============================================================
-- Wire courses to the external VIFM Digital Badges service.
--
-- Until now the elearning DB had local `badges` and `user_badges`
-- tables that were scaffolded but dormant — nothing inserted into
-- user_badges, no UI displayed them, and they had no relation to
-- courses. The external badges service (vifm-digital-badges) is now
-- the source of truth for badge templates and issued badges.
--
-- We keep the local tables in place for now (they're unused and
-- harmless) so anyone with cached deploys doesn't break. They can
-- be dropped in a follow-up migration once we've confirmed nothing
-- references them.
-- ============================================================

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS badge_template_external_id text;

COMMENT ON COLUMN courses.badge_template_external_id IS
  'ID of a badge template in the external VIFM Digital Badges service. When a learner completes this course, a badge based on this template is auto-issued via POST /api/v1/badges/issue. NULL = no badge for this course.';

CREATE INDEX IF NOT EXISTS idx_courses_badge_template_external_id
  ON courses (badge_template_external_id)
  WHERE badge_template_external_id IS NOT NULL;
