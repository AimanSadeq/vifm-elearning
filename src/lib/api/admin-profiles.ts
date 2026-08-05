/**
 * Client-side access to other people's profiles, for the admin and corporate
 * consoles.
 *
 * These used to query `profiles` directly from the browser. The table now
 * grants `authenticated` only (id, full_name, full_name_ar, avatar_url) —
 * email, phone, role and organization_id are private, and a column grant
 * cannot tell an admin apart from a learner. `/api/admin/profiles` does the
 * read with the service role after checking the caller's own role server-side.
 */

export type AdminProfile = {
  id: string;
  full_name: string | null;
  full_name_ar: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  organization_id: string | null;
  department: string | null;
  language: string | null;
  is_active: boolean | null;
  last_login_at: string | null;
  created_at: string | null;
};

export type AdminProfileQuery = {
  ids?: string[];
  search?: string;
  role?: string;
  isActive?: boolean;
  organizationId?: string;
  page?: number;
  pageSize?: number;
  orderBy?: "created_at" | "full_name";
};

function toParams(q: AdminProfileQuery, extra: Record<string, string> = {}) {
  const p = new URLSearchParams(extra);
  if (q.ids?.length) p.set("ids", q.ids.join(","));
  if (q.search) p.set("search", q.search);
  if (q.role) p.set("role", q.role);
  if (q.isActive !== undefined) p.set("isActive", String(q.isActive));
  if (q.organizationId) p.set("organizationId", q.organizationId);
  if (q.page !== undefined) p.set("page", String(q.page));
  if (q.pageSize !== undefined) p.set("pageSize", String(q.pageSize));
  if (q.orderBy) p.set("orderBy", q.orderBy);
  return p;
}

export async function fetchAdminProfiles(
  q: AdminProfileQuery = {}
): Promise<{ rows: AdminProfile[]; count: number; error?: string }> {
  const res = await fetch(`/api/admin/profiles?${toParams(q)}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { rows: [], count: 0, error: body.error ?? `Request failed (${res.status})` };
  }
  return res.json();
}

/** Just the matching row count — the `head: true` equivalent. */
export async function countAdminProfiles(q: AdminProfileQuery = {}): Promise<number> {
  const res = await fetch(`/api/admin/profiles?${toParams(q, { countOnly: "1" })}`);
  if (!res.ok) return 0;
  const { count } = await res.json();
  return count ?? 0;
}

export async function setProfileActive(id: string, isActive: boolean): Promise<string | null> {
  const res = await fetch("/api/admin/profiles", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, is_active: isActive }),
  });
  if (res.ok) return null;
  const body = await res.json().catch(() => ({}));
  return body.error ?? `Request failed (${res.status})`;
}
