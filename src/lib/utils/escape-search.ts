/**
 * Escape user input for PostgREST filter values.
 *
 * Two layers of escaping:
 *
 * 1. SQL LIKE: `%` and `_` are wildcards, `\` is the escape char. Without
 *    escaping, a search for `100%` matches every row.
 *
 * 2. PostgREST `.or()` syntax: the argument string treats `,` as a clause
 *    separator and `(` / `)` as grouping. A user search containing those
 *    can break the parser (400) or alter the filter shape entirely. Since
 *    every current caller pipes the output into `.or(...)`, strip them out
 *    — for free-text search, dropping these is more useful than dropping
 *    the request.
 *
 * If you ever need to feed unescaped output into a single `.ilike()` call
 * (where `,()*` are NOT special), use the deprecated `escapeIlikeOnly`.
 */
export function escapeIlike(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_")
    .replace(/[,()*]/g, " ");
}

/**
 * SQL-LIKE escaping only — does NOT strip PostgREST `.or()` separators.
 * Only use when the result is going into a standalone `.ilike()`/`.like()`
 * filter, not inside `.or(...)`.
 */
export function escapeIlikeOnly(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
}
