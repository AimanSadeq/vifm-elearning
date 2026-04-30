/** RFC 4122 UUID format check. Use this on `[id]` route params before
 *  feeding them to a DB lookup so that nothing weird (path traversal,
 *  empty strings, multi-MB inputs) reaches PostgREST. */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-7][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}
