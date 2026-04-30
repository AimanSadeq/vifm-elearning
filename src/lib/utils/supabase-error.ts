import { toast } from "sonner";

interface SupabaseError {
  message?: string;
  code?: string;
}

/**
 * Standard handler for Supabase query errors on admin pages. Catches the
 * common stale-session case (expired JWT → PostgREST `PGRST301`, or any
 * "jwt"-mentioning error message) and surfaces it as "session expired" so
 * the user knows to re-authenticate. Other errors fall back to a generic
 * toast with the underlying message.
 *
 * Always calls console.error so the original error is still visible to
 * developers in the browser DevTools.
 */
export function reportSupabaseError(
  error: SupabaseError,
  fallback = "Something went wrong"
): void {
  console.error("[supabase] query failed:", error);
  const code = error.code;
  const msg = (error.message ?? "").toLowerCase();
  // Only treat this as an auth/JWT error when the signal is unambiguous —
  // earlier we matched any "expired" substring, which falsely flagged things
  // like "promo code expired" / "voucher expired" from RPC return values.
  const isJwtExpired =
    code === "PGRST301" ||
    msg.includes("jwt expired") ||
    msg.includes("invalid jwt") ||
    (msg.includes("session") && msg.includes("expired"));
  if (isJwtExpired) {
    toast.error("Your session expired — please sign in again.");
    return;
  }
  if (code === "42501") {
    toast.error("You don't have permission to view this.");
    return;
  }
  toast.error(
    `${fallback}: ${error.message || error.code || "unknown error"}`
  );
}
