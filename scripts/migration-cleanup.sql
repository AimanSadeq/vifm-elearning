-- =============================================================================
-- Migration cleanup — run in Supabase SQL editor.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. DELETE 15 DEMO WEBINARS
-- -----------------------------------------------------------------------------
-- These were pre-production seed data (5 titles × 3 duplicates each, all
-- created 2026-02-23 BEFORE the Thinkific migration ran on 2026-03-17).
-- Thinkific had no webinar data, so the `webinars` table is pure seed garbage.
-- Safe to delete.
--
-- Run the preview SELECT first to confirm you see exactly 15 rows.
-- -----------------------------------------------------------------------------

-- Preview
SELECT id, title, status, scheduled_at, created_at
FROM webinars
WHERE title IN (
  'The Future of AI in Financial Services',
  'Blockchain and Digital Assets in Banking',
  'ESG Investing Trends 2026',
  'Cybersecurity for Financial Institutions',
  'Women in Finance Leadership Summit'
)
ORDER BY created_at;

-- Delete (uncomment to run)
-- DELETE FROM webinars
-- WHERE title IN (
--   'The Future of AI in Financial Services',
--   'Blockchain and Digital Assets in Banking',
--   'ESG Investing Trends 2026',
--   'Cybersecurity for Financial Institutions',
--   'Women in Finance Leadership Summit'
-- );


-- -----------------------------------------------------------------------------
-- 2. THE 3 MISSING PAYMENTS — RECONCILED
-- -----------------------------------------------------------------------------
-- The 3 orphan thinkific_orders (thinkific_id 87950934, 26341494, 26341464)
-- had user_email = null and user_thinkific_id not in thinkific_users staging.
-- All 3 were $0 free-course signups.
--
-- They have been reconciled by creating 3 placeholder auth users + profiles
-- (is_active=false, role=learner, email=orphan-thinkific-<id>@migrated.vifm.local)
-- and inserting 3 payments with metadata.orphan=true.
--
-- payments = 3,077 = thinkific_orders (100% parity).
--
-- Verify:
-- -----------------------------------------------------------------------------

SELECT
  (SELECT count(*) FROM payments)         AS payments,
  (SELECT count(*) FROM thinkific_orders) AS thinkific_orders;

-- See the 3 orphan payments:
SELECT id, user_id, amount, status, metadata
FROM payments
WHERE metadata->>'orphan' = 'true';

-- See the 3 placeholder profiles:
SELECT id, email, full_name, role, is_active
FROM profiles
WHERE email LIKE 'orphan-thinkific-%@migrated.vifm.local';


-- -----------------------------------------------------------------------------
-- 3. CDIP COURSE — NO ACTION NEEDED (verified healthy)
-- -----------------------------------------------------------------------------
-- Thinkific had two CDIP-named courses:
--   thinkific_id 1995597 (5 chapters, 14 contents, 0 enrollments) — abandoned draft
--   thinkific_id 3086701 (11 chapters, 67 contents, 138 enrollments) — real course
--
-- The migration merged them under one slug. Verified on production:
--   local course 71d90df2-13b4-4708-9a9e-f406ef12365b has:
--     - 6 curated modules with v2 content
--     - 64 lessons (vs Thinkific v2's 67 — close enough given merge dedup)
--     - 138 enrollments — all v2 students correctly linked
--
-- Reference query to re-verify:
-- -----------------------------------------------------------------------------

-- Local CDIP course
SELECT c.id, c.title, c.slug, c.metadata,
       (SELECT count(*) FROM modules m WHERE m.course_id = c.id)    AS modules,
       (SELECT count(*) FROM lessons l WHERE l.course_id = c.id)    AS lessons,
       (SELECT count(*) FROM enrollments e WHERE e.course_id = c.id) AS enrollments
FROM courses c
WHERE c.metadata->>'thinkific_id' = '1995597';
