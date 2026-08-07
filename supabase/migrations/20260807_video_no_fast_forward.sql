-- Enforce "no fast-forward on first watch" across the portal.
--
-- The clamp itself already lives in VideoPlayer (seekRestricted =
-- isFirstWatch && !allowSkipping), but it never engaged because every lesson
-- carried allow_skipping = true, and the admin content dialogs wrote their
-- video settings into lessons.metadata while /api/video/config reads the real
-- columns. This migration flips the defaults and reconciles the two.

-- ============================================================
-- 1. Defaults: restricted unless a lesson explicitly opts out
-- ============================================================
ALTER TABLE lessons
  ALTER COLUMN allow_skipping SET DEFAULT false,
  ALTER COLUMN force_watch_first SET DEFAULT true;

-- ============================================================
-- 2. Backfill the settings the admin UI wrote into metadata
--    into the columns the video config API actually reads.
--    Only rows that carry a metadata value are touched.
-- ============================================================
UPDATE lessons
SET
  allow_speed_control = COALESCE(
    (metadata ->> 'allow_speed_control')::boolean,
    allow_speed_control
  ),
  allow_download = COALESCE(
    (metadata ->> 'allow_download')::boolean,
    allow_download
  ),
  minimum_watch_percentage = COALESCE(
    (metadata ->> 'minimum_watch_percentage')::integer,
    minimum_watch_percentage
  )
WHERE content_type = 'video'
  AND metadata ?| ARRAY[
    'allow_speed_control',
    'allow_download',
    'minimum_watch_percentage'
  ];

-- ============================================================
-- 3. Turn the restriction on for every existing video lesson.
--    metadata.force_watch_first is deliberately NOT consulted here: the
--    bulk uploader and the Thinkific transfer both hard-coded it to false on
--    every row, and nothing ever read it, so it records a stale default
--    rather than an admin decision. Opting a lesson back out is a one-row
--    edit in the content editor.
-- ============================================================
UPDATE lessons
SET
  allow_skipping = false,
  force_watch_first = true
WHERE content_type = 'video';

-- ============================================================
-- 4. Drop the now-duplicated metadata keys so there is a single
--    source of truth for these settings.
-- ============================================================
UPDATE lessons
SET metadata = metadata
  - 'allow_speed_control'
  - 'allow_download'
  - 'minimum_watch_percentage'
  - 'force_watch_first'
WHERE metadata ?| ARRAY[
  'allow_speed_control',
  'allow_download',
  'minimum_watch_percentage',
  'force_watch_first'
];
