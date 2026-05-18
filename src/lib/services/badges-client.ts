import { env } from "@/lib/env";

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
  title: string;
  tier?: string;
  category?: string;
  image_url?: string;
  preview_url?: string;
}

export interface IssuedBadge {
  id: string;
  verification_id: string;
  template_id: string;
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

export const badgesClient = {
  isEnabled: isBadgesEnabled,

  listTemplates(): Promise<BadgesResult<{ data: BadgeTemplate[] }>> {
    return call("GET", "/templates");
  },

  upsertDelegate(input: UpsertDelegateInput): Promise<BadgesResult<unknown>> {
    return call("PUT", `/delegates/${encodeURIComponent(input.externalId)}`, {
      name: input.name,
      email: input.email,
    });
  },

  issueBadge(input: IssueBadgeInput): Promise<BadgesResult<IssuedBadge>> {
    return call(
      "POST",
      "/badges/issue",
      {
        external_id: input.externalId,
        template_id: input.templateId,
        delegate: {
          external_id: input.delegateExternalId,
          name: input.delegateName,
          email: input.delegateEmail,
        },
        issued_at: input.issuedAt ?? new Date().toISOString(),
        metadata: input.metadata,
      },
      input.externalId,
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
