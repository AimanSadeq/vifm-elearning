import { z } from "zod";

/**
 * Centralised env-var validation.
 *
 * - Server-only required vars are validated at module import. In production
 *   a missing required var throws synchronously, so the app fails to boot
 *   instead of failing at the first paying customer's checkout.
 * - In development we log a warning and continue, so a partial `.env.local`
 *   doesn't break local dev.
 * - Public vars (NEXT_PUBLIC_*) are baked into the client bundle by Next at
 *   build time. Re-exporting them from here gives a single source of truth
 *   without breaking client imports — Next replaces `process.env.NEXT_PUBLIC_*`
 *   with literals on the client, and skips the rest entirely on the client.
 *
 * Add new vars here and remove them from `.env.example` if they aren't
 * actually used anywhere.
 */

const isServer = typeof window === "undefined";

const serverEnvSchema = z.object({
  // --- Supabase (required) ---
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),

  // --- App ---
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_NAME: z.string().optional(),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // --- Stripe (optional — feature-gated at call sites) ---
  STRIPE_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_WEBHOOK_SECRET_DESIGNATIONS: z.string().optional(),

  // --- PayTabs (optional) ---
  PAYTABS_PROFILE_ID: z.string().optional(),
  PAYTABS_SERVER_KEY: z.string().optional(),
  PAYTABS_BASE_URL: z.string().url().optional(),
  PAYTABS_REGION: z.string().optional(),

  // --- MamoPay (optional) ---
  MAMOPAY_API_KEY: z.string().optional(),
  MAMOPAY_ENV: z.enum(["sandbox", "production"]).optional(),
  MAMOPAY_WEBHOOK_SECRET: z.string().optional(),

  // --- Bank transfer details (shown on checkout) ---
  BANK_IBAN: z.string().optional(),
  BANK_SWIFT: z.string().optional(),

  // --- Email (Resend) ---
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),

  // --- Cron auth ---
  CRON_SECRET: z.string().optional(),

  // --- Rate-limit Redis (optional — falls back to in-memory) ---
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // --- VIFM Digital Badges (optional — feature-gated at call sites) ---
  BADGES_API_BASE_URL: z.string().url().optional(),
  BADGES_API_KEY: z.string().optional(),
  NEXT_PUBLIC_BADGES_PUBLIC_URL: z.string().url().optional(),
});

type ServerEnv = z.infer<typeof serverEnvSchema>;

function loadEnv(): ServerEnv {
  if (!isServer) {
    // On the client, only NEXT_PUBLIC_* vars are real — pretend the rest
    // don't exist and skip validation. Server-only vars are never read
    // from client code anyway.
    return process.env as unknown as ServerEnv;
  }

  const parsed = serverEnvSchema.safeParse(process.env);
  if (parsed.success) return parsed.data;

  const issues = parsed.error.flatten().fieldErrors;
  const formatted = Object.entries(issues)
    .map(([key, msgs]) => `  ${key}: ${msgs?.join(", ") ?? "invalid"}`)
    .join("\n");

  // Next.js sets NEXT_PHASE=phase-production-build during `next build`. The
  // build only needs to compile bundles — it never hits Supabase or any
  // gateway — so we MUST NOT throw here, otherwise CI builds fail any time
  // a real production secret isn't passed in (which it shouldn't be).
  // Strict validation still runs at runtime startup (NEXT_PHASE is unset
  // there), so misconfigured production servers still fail fast on boot.
  const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

  if (process.env.NODE_ENV === "production" && !isBuildPhase) {
    throw new Error(
      `Invalid environment configuration:\n${formatted}\n\n` +
        `Set the missing/invalid variables in Render → Environment, then redeploy.`
    );
  }

  console.warn(
    `[env] Validation warnings (build phase / dev):\n${formatted}\n` +
      `These will fail-fast at runtime if not corrected before deploy.`
  );
  return process.env as unknown as ServerEnv;
}

export const env = loadEnv();

/**
 * Canonical app origin. Falls back to localhost:5000 in dev so checkout
 * success/cancel URLs still resolve. In production NEXT_PUBLIC_APP_URL is
 * required (validated above) — there is no production fallback.
 *
 * Trailing slash is stripped so callers can safely concatenate paths.
 */
function resolveAppUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL;
  if (raw) return raw.replace(/\/+$/, "");
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_APP_URL is required in production — configure it in Render."
    );
  }
  return "http://localhost:5000";
}

export const APP_URL = resolveAppUrl();
