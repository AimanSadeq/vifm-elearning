/**
 * Shared rules for the admin lesson write routes (/api/admin/lessons/*).
 *
 * `authenticated` can no longer write `lessons` directly, so the console goes
 * through routes that use the service role. Those routes must decide for
 * themselves which columns a caller may set.
 */

// Columns the console may set on a lesson. Anything else in a request body is
// dropped rather than passed through to the service role. course_id and
// module_id are handled separately by the routes.
export const LESSON_WRITABLE_FIELDS = [
  "title",
  "title_ar",
  "description",
  "description_ar",
  "content_type",
  "sort_order",
  "is_mandatory",
  "is_preview",
  "metadata",
  "video_url",
  "video_duration_seconds",
  "duration_minutes",
  "document_url",
  "document_type",
  "content_html",
  "assignment_max_points",
  "assignment_allow_file",
  "assignment_allow_text",
  "force_watch_first",
  "allow_skipping",
  "allow_speed_control",
  "allow_download",
  "minimum_watch_percentage",
] as const;

export function pickLessonFields(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of LESSON_WRITABLE_FIELDS) {
    if (key in body) out[key] = body[key];
  }
  return out;
}

// video_url is rendered into the player and used to derive signed-URL paths
// from a Supabase Storage bucket. Restrict it to either:
//   1. a relative bucket path — `<courseId>/<file>` as issued by
//      /api/admin/courses/:id/upload-url, or a legacy `course-videos/` /
//      `lesson-videos/` prefixed path, OR
//   2. an https:// URL on an approved external host (Vimeo / YouTube).
const ALLOWED_BUCKET_PREFIXES = ["course-videos/", "lesson-videos/"];
const UPLOADED_PATH = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[^\s\\]+$/i;
const ALLOWED_EXTERNAL_HOSTS = new Set([
  "player.vimeo.com",
  "vimeo.com",
  "www.youtube.com",
  "youtube.com",
  "youtu.be",
]);

export const VIDEO_URL_ERROR =
  "video_url must be an uploaded course video path or an https URL on an approved host (Vimeo/YouTube)";

export function isAllowedVideoUrl(val: string): boolean {
  if (val.length === 0 || val.length > 2048) return false;
  // Reject anything starting with a non-https scheme (javascript:, data:, …)
  if (/^[a-z][a-z0-9+.-]*:/i.test(val) && !val.startsWith("https://")) {
    return false;
  }
  if (val.includes("..")) return false;
  if (ALLOWED_BUCKET_PREFIXES.some((p) => val.startsWith(p))) return true;
  if (UPLOADED_PATH.test(val)) return true;
  if (val.startsWith("https://")) {
    try {
      return ALLOWED_EXTERNAL_HOSTS.has(new URL(val).hostname);
    } catch {
      return false;
    }
  }
  return false;
}
