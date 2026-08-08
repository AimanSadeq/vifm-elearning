import { createHmac } from "node:crypto";

/**
 * Opaque handle for the right-hand item of a matching pair.
 *
 * A matching question keeps both halves of a pair on the SAME quiz_options
 * row, so handing the learner the row id alongside the shuffled right-hand
 * items would give away the entire answer key — they could pair by id. Instead
 * each right-hand item travels under an HMAC of its row id: stable enough to
 * score against, opaque enough that the mapping can't be recovered client-side.
 *
 * Server-only. The secret never reaches the browser.
 */
export function matchKeyFor(optionId: string): string {
  const secret =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "vifm-matching-fallback-secret";
  return createHmac("sha256", secret).update(optionId).digest("hex").slice(0, 16);
}

/** Fisher-Yates. Used to shuffle the right-hand column before it is sent out. */
export function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
