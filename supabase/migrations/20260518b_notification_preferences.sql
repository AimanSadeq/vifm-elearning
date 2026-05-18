-- ============================================================
-- Per-learner notification preferences.
--
-- Single JSONB column on profiles. Defaults all opt-in EXCEPT
-- marketing (which we treat as explicit opt-in to be on the
-- right side of email regulations). Each key is a boolean.
--
-- Transactional notifications (enrollment confirmation,
-- certificates, password reset) are deliberately NOT covered
-- here — they're always sent.
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB
  NOT NULL
  DEFAULT '{
    "email_notifications": true,
    "webinar_reminders":   true,
    "course_updates":      true,
    "marketing_emails":    false
  }'::jsonb;

COMMENT ON COLUMN profiles.notification_preferences IS
  'Per-channel opt-in flags. Transactional sends bypass these. Marketing defaults to false.';
