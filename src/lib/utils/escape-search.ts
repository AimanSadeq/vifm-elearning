/**
 * Escape special characters for PostgREST ilike filters.
 * Prevents user input from being interpreted as wildcards or filter syntax.
 */
export function escapeIlike(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
}
