/**
 * Column lists for tables where `authenticated` holds a column grant rather
 * than a table-wide one.
 *
 * `select("*")` on these now fails with "permission denied for column" — the
 * grant is what stops a signed-in learner reading a webinar's join link or
 * another user's email, and PostgREST expands `*` to every column, not to the
 * ones you happen to be allowed.
 */

/**
 * Everything on `public.webinars` except the join secrets (`meeting_url`,
 * `meeting_id`) and the free-form `metadata` bag.
 *
 * Getting into the room is what registration is for: read `meeting_url` from
 * the `webinar_access` view, which only returns rows you registered for.
 *
 * Declared as one `as const` string rather than an array join: supabase-js
 * parses the select() argument at the *type* level, and a value widened to
 * `string` makes every embedding query resolve to ParserError.
 */
export const WEBINAR_PUBLIC_COLUMNS =
  "id, title, title_ar, description, description_ar, thumbnail_url, instructor_id, category_id, status, scheduled_at, duration_minutes, is_recording_public, max_attendees, is_free, price, currency, tags, created_at, updated_at, cpe_hours, cpe_category_id" as const;

/** The four public columns of `public.profiles`. */
export const PROFILE_PUBLIC_COLUMNS = "id, full_name, full_name_ar, avatar_url" as const;
