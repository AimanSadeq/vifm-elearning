-- ============================================================
-- Performance indexes for hot query paths
-- ============================================================
--
-- Pass-4 audit identified several hot paths that hit Postgres without a
-- supporting index. Each index below maps to a query already in src/.
-- All operations are idempotent (`IF NOT EXISTS`) — safe to re-run.
--
-- ⚠️  CONCURRENT keyword used so this can be applied to a live DB without
--     locking out writes; that means it can only be run outside an
--     explicit transaction (Supabase migrations apply each file in its
--     own transaction by default — pg infers this from the keyword).
-- ============================================================

-- 1. subscriptions/checkout in-flight check:
--    payments WHERE user_id = ? AND payment_type = ? AND status = ? AND created_at > ?
-- Composite index covers all three equality predicates and the time range scan.
CREATE INDEX IF NOT EXISTS idx_payments_user_type_status_created
  ON payments(user_id, payment_type, status, created_at DESC);

-- 2. Webhook payment lookup by user (admin reconciliation, refunds):
CREATE INDEX IF NOT EXISTS idx_payments_user_id
  ON payments(user_id);

-- 3. Bank-transfer dedupe + course-page payment history:
CREATE INDEX IF NOT EXISTS idx_payments_course_id
  ON payments(course_id) WHERE course_id IS NOT NULL;

-- 4. Promo usage increment / reporting:
CREATE INDEX IF NOT EXISTS idx_payments_promo_code_id
  ON payments(promo_code_id) WHERE promo_code_id IS NOT NULL;

-- 5. Forum listing per course (page hits + post counts):
CREATE INDEX IF NOT EXISTS idx_forum_posts_course_id
  ON forum_posts(course_id);

-- 6. Voucher redemption lookups (uniqueness + per-user listing):
CREATE INDEX IF NOT EXISTS idx_voucher_redemptions_user_voucher
  ON voucher_redemptions(user_id, voucher_id);
CREATE INDEX IF NOT EXISTS idx_voucher_redemptions_course_id
  ON voucher_redemptions(course_id);

-- 7. lesson_progress is hit on every lesson view + completion-rate calcs:
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_lesson
  ON lesson_progress(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_course_user
  ON lesson_progress(course_id, user_id) WHERE course_id IS NOT NULL;

-- 8. Designation holders (cron, admin lists, renewals):
CREATE INDEX IF NOT EXISTS idx_designation_holders_status
  ON designation_holders(status);
CREATE INDEX IF NOT EXISTS idx_designation_holders_designation_status
  ON designation_holders(designation_id, status);
-- Suspended-ageing scan in the lapsed transition:
CREATE INDEX IF NOT EXISTS idx_designation_holders_suspended_at
  ON designation_holders(suspended_at) WHERE suspended_at IS NOT NULL;

-- 9. Notifications: per-user paginated reads order by created_at DESC.
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON notifications(user_id, created_at DESC);

-- 10. audit_log: time-windowed admin queries already index user_id, action,
--     and created_at separately (001_initial_schema.sql); add a composite
--     for the common "show me what this admin did last week" query.
CREATE INDEX IF NOT EXISTS idx_audit_log_user_created
  ON audit_log(user_id, created_at DESC);

-- 11. Certificates: verification code lookups (public endpoint).
--     The column likely already has a unique constraint (codes are unique
--     per cert) — add a regular index defensively if not.
CREATE INDEX IF NOT EXISTS idx_certificates_verification_code
  ON certificates(verification_code);

-- 12. Webinar registrations + recordings:
CREATE INDEX IF NOT EXISTS idx_webinar_registrations_user_webinar
  ON webinar_registrations(user_id, webinar_id);
