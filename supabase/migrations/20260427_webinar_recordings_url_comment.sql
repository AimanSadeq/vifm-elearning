-- Document the polymorphism on webinar_recordings.url so future readers don't
-- assume URL-shape and break legacy rows.
--
-- The column holds one of two things:
--   • A Supabase Storage path inside the `course-videos` bucket, of the form
--     `webinars/<webinar-id>/<timestamp>-<filename>`. This is what the admin
--     upload UI writes today; the public recording-fetch endpoint signs it
--     on demand with a short-lived URL.
--   • A pre-existing absolute http(s) URL — legacy entries created via SQL
--     before the upload UI shipped, or external host links pasted manually.
--
-- The recording-fetch endpoint at /api/webinars/[id]/recording disambiguates
-- by checking `^https?://` on the value; everything else is treated as a
-- Storage path and signed via createCourseVideoSignedUrl.

COMMENT ON COLUMN public.webinar_recordings.url IS
  'Either a Supabase Storage path (webinars/<id>/<file>) inside course-videos, OR an absolute http(s) URL (legacy/external). Disambiguated at read time by ^https?://.';
