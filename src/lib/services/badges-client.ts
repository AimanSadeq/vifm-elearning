import { env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Thin wrapper around the VIFM Digital Badges external v1 REST API
 * (X-API-Key auth, idempotency via header). Keeps every external call
 * server-side so the API key never reaches the browser.
 *
 * All methods return `{ ok: true, data }` on 2xx and `{ ok: false, error,
 * status }` on failure — callers decide whether to throw, swallow, or
 * surface. Award triggers use the swallow path so a flaky badges service
 * never blocks course completion / certificate issuance.
 */

export interface BadgeTemplate {
  id: string;
  external_id?: string;
  // External API column name is `name`. Older drafts of this code used
  // `title`; aliased so any pre-existing consumers keep working.
  name: string;
  title?: string;
  tier?: string;
  category?: string;
  image_url?: string;
  preview_url?: string;
}

export interface IssuedBadge {
  id: string;
  verification_id: string;
  template_id: string;
  // External API returns the template's display name as `template_name`,
  // with `badge_name` set to the per-issuance override if any.
  template_name?: string;
  badge_name?: string;
  /** @deprecated kept for back-compat — use template_name / badge_name. */
  template_title?: string;
  delegate_external_id?: string;
  delegate_name?: string;
  status: "pending" | "active" | "revoked" | "expired";
  issued_at?: string;
  image_url?: string;
}

export interface BadgesResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  status?: number;
}

interface IssueBadgeInput {
  templateId: string;
  delegateExternalId: string;
  delegateName: string;
  delegateEmail?: string;
  externalId: string; // idempotency key — typically `${courseId}:${userId}`
  issuedAt?: string;
  metadata?: Record<string, unknown>;
}

interface UpsertDelegateInput {
  externalId: string;
  name: string;
  email?: string;
}

function getConfig() {
  const baseUrl = env.BADGES_API_BASE_URL;
  const apiKey = env.BADGES_API_KEY;
  if (!baseUrl || !apiKey) return null;
  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}

export function isBadgesEnabled(): boolean {
  return getConfig() !== null;
}

async function call<T>(
  method: string,
  path: string,
  body?: unknown,
  idempotencyKey?: string,
): Promise<BadgesResult<T>> {
  const cfg = getConfig();
  if (!cfg) return { ok: false, error: "Badges integration is not configured" };

  const headers: Record<string, string> = {
    "X-API-Key": cfg.apiKey,
    "Content-Type": "application/json",
  };
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

  try {
    const res = await fetch(`${cfg.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      // Don't cache — badges are user-specific.
      cache: "no-store",
    });

    const text = await res.text();
    const data = text ? safeJson(text) : null;

    if (!res.ok) {
      const msg =
        (data && typeof data === "object" && "error" in data
          ? String((data as { error: unknown }).error)
          : null) ?? `Badges API ${res.status}`;
      return { ok: false, error: msg, status: res.status };
    }

    return { ok: true, data: data as T };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

function safeJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

/**
 * Badges service requires first_name + last_name. Most VIFM profiles have
 * a single `full_name` field — split on the first space, fall back to
 * "Learner" / "User" so the upsert never 400s on a name-only learner.
 */
function splitName(full: string): { first_name: string; last_name: string } {
  const trimmed = (full ?? "").trim();
  if (!trimmed) return { first_name: "Learner", last_name: "User" };
  const idx = trimmed.indexOf(" ");
  if (idx === -1) return { first_name: trimmed, last_name: "—" };
  return {
    first_name: trimmed.slice(0, idx),
    last_name: trimmed.slice(idx + 1).trim() || "—",
  };
}

export const badgesClient = {
  isEnabled: isBadgesEnabled,

  listTemplates(): Promise<BadgesResult<{ data: BadgeTemplate[] }>> {
    return call("GET", "/templates");
  },

  /**
   * Create a new badge template in the external service. `tier` must be one
   * of the values the badges service accepts:
   *   course | specialization | certification | distinction
   */
  createTemplate(input: {
    name: string;
    tier: "course" | "specialization" | "certification" | "distinction";
    category: string;
    criteria: string;
    description?: string;
    skills?: string[];
    externalId?: string;
  }): Promise<BadgesResult<{ id: string; external_id?: string; created?: boolean }>> {
    return call("POST", "/templates", {
      name: input.name,
      tier: input.tier,
      category: input.category,
      criteria: input.criteria,
      description: input.description ?? "",
      skills: input.skills ?? [],
      external_id: input.externalId,
    });
  },

  upsertDelegate(input: UpsertDelegateInput): Promise<BadgesResult<unknown>> {
    const { first_name, last_name } = splitName(input.name);
    return call("PUT", `/delegates/${encodeURIComponent(input.externalId)}`, {
      first_name,
      last_name,
      email: input.email,
    });
  },

  issueBadge(input: IssueBadgeInput): Promise<BadgesResult<IssuedBadge>> {
    const { first_name, last_name } = splitName(input.delegateName);
    return call(
      "POST",
      "/badges/issue",
      {
        external_id: input.externalId,
        template_id: input.templateId,
        // The badges service reads delegate identity from top-level
        // fields (not a nested object). It also requires first_name +
        // last_name + email — single `name` is rejected with 400.
        delegate_external_id: input.delegateExternalId,
        email: input.delegateEmail,
        first_name,
        last_name,
        // Only send issued_at when explicitly provided. Defaulting to
        // new Date() made the body change on every retry, so the badges
        // service rejected the reused Idempotency-Key ("already used with a
        // different request body"). Omitting it keeps the body deterministic
        // for a given (course, user); the service stamps issued_at itself.
        issued_at: input.issuedAt,
        metadata: input.metadata,
      },
      // Idempotency key prefix bumped (v2 -> v3) to escape keys already
      // poisoned by the old volatile-issued_at body shape.
      `v3:${input.externalId}`,
    );
  },

  listBadgesForDelegate(
    delegateExternalId: string,
  ): Promise<BadgesResult<{ data: IssuedBadge[] }>> {
    const q = new URLSearchParams({
      delegate_external_id: delegateExternalId,
    });
    return call("GET", `/badges?${q.toString()}`);
  },

  listBadges(params: {
    page?: number;
    pageSize?: number;
    status?: string;
  } = {}): Promise<BadgesResult<{ data: IssuedBadge[]; total?: number }>> {
    const q = new URLSearchParams();
    if (params.page !== undefined) q.set("page", String(params.page));
    if (params.pageSize !== undefined) q.set("page_size", String(params.pageSize));
    if (params.status) q.set("status", params.status);
    const qs = q.toString();
    return call("GET", `/badges${qs ? `?${qs}` : ""}`);
  },

  revokeBadge(verificationId: string, reason?: string): Promise<BadgesResult<unknown>> {
    return call(
      "POST",
      "/badges/revoke",
      { verification_id: verificationId, reason },
      `revoke:${verificationId}`,
    );
  },
};

/**
 * Resolve (or auto-create) the badge template for a course. The badges
 * service is the source of truth; we deterministically tag templates we
 * create from this side with `external_id = course:{courseId}` so the
 * lookup is O(1)-by-filter even though the list endpoint isn't filtered
 * server-side (yet).
 *
 * If a template already exists with that external_id (e.g. the admin
 * created one earlier OR a previous course completion created it), we
 * reuse its id — we do NOT overwrite admin edits.
 *
 * Returns the template id on success, or { ok: false } if the badges
 * service is unreachable or rejects the create.
 */
export async function ensureCourseBadgeTemplate(opts: {
  courseId: string;
  courseTitle?: string;
  courseCategory?: string;
}): Promise<BadgesResult<{ id: string; reused: boolean }>> {
  if (!isBadgesEnabled()) {
    return { ok: false, error: "Badges integration is not configured" };
  }

  const externalId = `course:${opts.courseId}`;

  // 1. Look for an existing template tagged with this course.
  const list = await badgesClient.listTemplates();
  if (list.ok) {
    const found = (list.data?.data ?? []).find(
      (t) => t.external_id === externalId,
    );
    if (found) return { ok: true, data: { id: found.id, reused: true } };
  }

  // 2. None — create one with sensible defaults derived from the course.
  const created = await badgesClient.createTemplate({
    name: opts.courseTitle?.trim() || "Course Badge",
    tier: "course",
    category: opts.courseCategory?.trim() || "general",
    criteria: `Completed ${opts.courseTitle?.trim() || "the course"}`,
    externalId,
  });
  if (!created.ok || !created.data?.id) {
    return { ok: false, error: created.error ?? "Failed to create template" };
  }
  return { ok: true, data: { id: created.data.id, reused: false } };
}

/**
 * Issue a badge to a learner for completing a course. Idempotent on
 * `${courseId}:${userId}`. Safe to call from multiple triggers (course
 * completion AND certificate issuance) — the second call returns the
 * already-issued badge instead of creating a duplicate.
 *
 * Errors are logged and swallowed by the callers — a misconfigured or
 * down badges service must never block course completion.
 */
export async function issueCourseBadge(opts: {
  userId: string;
  userName: string;
  userEmail?: string;
  courseId: string;
  courseTitle?: string;
  templateExternalId: string;
}): Promise<BadgesResult<IssuedBadge>> {
  if (!isBadgesEnabled()) {
    return { ok: false, error: "Badges integration is not configured" };
  }

  // Lazy upsert of the delegate so we don't need a sync job. The badges
  // service accepts updates to existing delegates and creates new ones
  // on first sight.
  await badgesClient.upsertDelegate({
    externalId: opts.userId,
    name: opts.userName,
    email: opts.userEmail,
  });

  return badgesClient.issueBadge({
    templateId: opts.templateExternalId,
    delegateExternalId: opts.userId,
    delegateName: opts.userName,
    delegateEmail: opts.userEmail,
    externalId: `${opts.courseId}:${opts.userId}`,
    metadata: {
      course_id: opts.courseId,
      course_title: opts.courseTitle,
      source: "vifm-elearning",
    },
  });
}

export function badgeVerifyUrl(verificationId: string): string | null {
  const base = env.NEXT_PUBLIC_BADGES_PUBLIC_URL;
  if (!base) return null;
  return `${base.replace(/\/+$/, "")}/verify/${encodeURIComponent(verificationId)}`;
}

export function badgeImageUrl(verificationId: string): string | null {
  const base = env.NEXT_PUBLIC_BADGES_PUBLIC_URL;
  if (!base) return null;
  return `${base.replace(/\/+$/, "")}/api/verify/${encodeURIComponent(verificationId)}/image`;
}

/**
 * Issue badges for the learner's completed courses that have a badge attached
 * (course.badge_template_external_id set) but no badge yet. Self-heals
 * completions where the badge issuance never fired (e.g. the cert was issued
 * before the badge was enabled). Idempotent at the badges service.
 */
export interface BadgeSelfHealResult {
  courseId: string;
  courseTitle?: string;
  step: "template" | "issue" | "ok" | "skip";
  ok: boolean;
  error?: string;
}

export async function issueMissingBadges(
  userId: string,
): Promise<BadgeSelfHealResult[]> {
  const results: BadgeSelfHealResult[] = [];
  if (!isBadgesEnabled()) {
    return [{ courseId: "-", step: "skip", ok: false, error: "Badges not configured" }];
  }

  const { data: enrollments } = await supabaseAdmin
    .from("enrollments")
    .select(
      "course_id, course:courses!enrollments_course_id_fkey(title, badge_template_external_id, category:categories(name))",
    )
    .eq("user_id", userId)
    .eq("status", "completed");
  if (!enrollments?.length) return results;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("full_name, email")
    .eq("id", userId)
    .single();
  const userName = profile?.full_name ?? "Learner";
  const userEmail = profile?.email ?? undefined;

  for (const e of enrollments) {
    const courseId = e.course_id as string;
    const rel = e.course as unknown as
      | {
          title?: string | null;
          badge_template_external_id?: string | null;
          category?: { name?: string } | { name?: string }[] | null;
        }
      | Array<{
          title?: string | null;
          badge_template_external_id?: string | null;
          category?: { name?: string } | { name?: string }[] | null;
        }>
      | null;
    const course = Array.isArray(rel) ? rel[0] : rel;
    const courseTitle = course?.title ?? undefined;
    const stored = course?.badge_template_external_id ?? null;
    if (!stored) continue; // no badge attached to this course

    let templateId = stored;
    if (stored === "AUTO") {
      const cat = Array.isArray(course?.category)
        ? course?.category[0]
        : course?.category;
      const ensured = await ensureCourseBadgeTemplate({
        courseId,
        courseTitle,
        courseCategory: cat?.name,
      });
      if (!ensured.ok || !ensured.data?.id) {
        console.warn(
          `[badge self-heal] template ensure failed course=${courseId}: ${ensured.error}`,
        );
        results.push({
          courseId,
          courseTitle,
          step: "template",
          ok: false,
          error: ensured.error,
        });
        continue;
      }
      templateId = ensured.data.id;
    }

    try {
      const r = await issueCourseBadge({
        userId,
        userName,
        userEmail,
        courseId,
        courseTitle,
        templateExternalId: templateId,
      });
      if (!r.ok) {
        console.warn(
          `[badge self-heal] issue failed course=${courseId}: ${r.error}`,
        );
      }
      results.push({
        courseId,
        courseTitle,
        step: r.ok ? "ok" : "issue",
        ok: r.ok,
        error: r.ok ? undefined : r.error,
      });
    } catch (err) {
      console.warn(`[badge self-heal] issue threw course=${courseId}`, err);
      results.push({
        courseId,
        courseTitle,
        step: "issue",
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return results;
}
