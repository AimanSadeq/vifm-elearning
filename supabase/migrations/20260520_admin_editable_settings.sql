-- ============================================================
-- Seed editable values that were previously hardcoded in source.
--
-- Everything fits into the existing site_settings KV table — no
-- new schemas, no admin glue beyond reading these keys.
--
-- Keys added:
--   email_from                  string  — sender for transactional email
--   default_quiz_passing_score  number  — applied to new quizzes
--   default_quiz_max_attempts   number  — applied to new quizzes
--   homepage_stats              array   — about-page hero counters
--   footer_app_store_url        string  — empty = hide badge
--   footer_google_play_url      string  — empty = hide badge
--   designation_tiers           array   — replaces DESIGNATION_TIERS in code
--   email_templates             array   — {key, subject, html} per template
--
-- Existing offices + support_email keys are untouched.
-- ============================================================

INSERT INTO site_settings (key, value, description) VALUES
  (
    'email_from',
    '"VIFM Academy <noreply@learn.viftraining.com>"'::jsonb,
    'Sender name + address used for all transactional + marketing email.'
  ),
  (
    'default_quiz_passing_score',
    '70'::jsonb,
    'Default passing score (%) prefilled when creating a new quiz.'
  ),
  (
    'default_quiz_max_attempts',
    '3'::jsonb,
    'Default max attempts prefilled when creating a new quiz.'
  ),
  (
    'homepage_stats',
    '[
      {"key": "learners",  "value": "10,000+", "label": "Learners",  "labelAr": "متعلم"},
      {"key": "courses",   "value": "200+",    "label": "Courses",   "labelAr": "دورة"},
      {"key": "instructors","value": "50+",    "label": "Instructors","labelAr": "مدرب"},
      {"key": "countries", "value": "30+",     "label": "Countries", "labelAr": "دولة"}
    ]'::jsonb,
    'Stats shown on the /about hero. Edit any item to keep it in sync as the platform grows.'
  ),
  (
    'footer_app_store_url',
    '""'::jsonb,
    'iOS App Store deep-link. Leave blank to hide the badge in the footer.'
  ),
  (
    'footer_google_play_url',
    '""'::jsonb,
    'Google Play deep-link. Leave blank to hide the badge in the footer.'
  ),
  (
    'designation_tiers',
    '[
      {
        "id": "gateway",
        "label": "Gateway Tier",
        "labelAr": "المستوى التأسيسي",
        "description": "Begin your professional certification journey with foundational programs.",
        "descriptionAr": "ابدأ رحلتك في الشهادات المهنية مع البرامج التأسيسية.",
        "icon": "GraduationCap",
        "accentColor": "#10b981",
        "gradient": "from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30",
        "badgeColor": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
      },
      {
        "id": "professional",
        "label": "Professional Tier",
        "labelAr": "المستوى المهني",
        "description": "Advance your career with specialized AI and business certifications.",
        "descriptionAr": "طوّر مسيرتك المهنية مع شهادات متخصصة في الذكاء الاصطناعي والأعمال.",
        "icon": "Briefcase",
        "accentColor": "#3b82f6",
        "gradient": "from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30",
        "badgeColor": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      },
      {
        "id": "executive",
        "label": "Executive Tier",
        "labelAr": "المستوى التنفيذي",
        "description": "Lead with strategic expertise through our most advanced programs.",
        "descriptionAr": "قُد بخبرة استراتيجية من خلال برامجنا الأكثر تقدمًا.",
        "icon": "Crown",
        "accentColor": "#f59e0b",
        "gradient": "from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30",
        "badgeColor": "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
      }
    ]'::jsonb,
    'Designation tiers shown across marketing pages, course/path detail pages, and the admin course form.'
  ),
  (
    'email_templates',
    '[
      {
        "key": "enrollment_confirmation",
        "name": "Enrollment confirmation",
        "subject": "Enrollment confirmed — {{courseName}}",
        "html": "<h2>Welcome to {{courseName}}</h2><p>Hi {{userName}},</p><p>You''re enrolled. Sign in any time at <a href=\"{{appUrl}}\">VIFM Academy</a> to start learning.</p><p>— VIFM Academy</p>"
      },
      {
        "key": "webinar_reminder",
        "name": "Webinar reminder",
        "subject": "Reminder: {{webinarTitle}}",
        "html": "<h2>{{webinarTitle}}</h2><p>Hi {{userName}},</p><p>Reminder: your webinar starts at {{scheduledAt}}.</p><p><a href=\"{{joinUrl}}\" style=\"display:inline-block;padding:10px 18px;background:#134BA1;color:#fff;text-decoration:none;border-radius:6px;\">Join the webinar</a></p>"
      }
    ]'::jsonb,
    'Transactional email templates. Supports {{placeholder}} substitution per template.'
  )
ON CONFLICT (key) DO NOTHING;
