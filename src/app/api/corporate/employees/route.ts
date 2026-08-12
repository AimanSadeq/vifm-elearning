import { NextRequest, NextResponse } from "next/server";
import { requireCorporateAdmin } from "@/lib/services/require-corporate-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  inviteCorporateEmployee,
  seatUsage,
} from "@/lib/services/corporate-employee-service";

/**
 * Corporate self-service employee management. All operations are scoped to the
 * caller's own organization (derived server-side, never from the request).
 *
 * GET   seat usage for the header (used / max)
 * POST  invite a new employee (learner role only) — enforces the seat limit,
 *       creates the account with a temporary password, emails credentials
 * PATCH update an employee: is_active (deactivate frees a seat), department
 */

export async function GET() {
  const { organizationId, error } = await requireCorporateAdmin();
  if (error) return error;
  const seats = await seatUsage(organizationId);
  return NextResponse.json({ data: seats });
}

export async function POST(req: NextRequest) {
  const { user: caller, organizationId, error } = await requireCorporateAdmin();
  if (error) return error;

  let body: {
    email?: string;
    fullName?: string;
    fullNameAr?: string;
    department?: string;
    language?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const outcome = await inviteCorporateEmployee({
    organizationId,
    email: body.email ?? "",
    fullName: body.fullName ?? "",
    fullNameAr: body.fullNameAr,
    department: body.department,
    language: body.language,
  });
  if (!outcome.ok) {
    return NextResponse.json(
      { error: outcome.error, code: outcome.code },
      { status: outcome.status },
    );
  }

  await supabaseAdmin.from("audit_log").insert({
    user_id: caller.id,
    action: "corporate.employee_invited",
    table_name: "profiles",
    record_id: outcome.data.id,
    new_values: { email: outcome.data.email, organization_id: organizationId },
    ip_address:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    user_agent: req.headers.get("user-agent") ?? null,
  });

  return NextResponse.json({ data: outcome.data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { user: caller, organizationId, error } = await requireCorporateAdmin();
  if (error) return error;

  let body: { id?: string; isActive?: boolean; department?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  // Target must be a learner in the caller's organization.
  const { data: target } = await supabaseAdmin
    .from("profiles")
    .select("id, role, organization_id, is_active")
    .eq("id", body.id)
    .maybeSingle();
  if (
    !target ||
    target.organization_id !== organizationId ||
    target.role !== "learner"
  ) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  const update: Record<string, unknown> = {};
  if ("isActive" in body) update.is_active = Boolean(body.isActive);
  if ("department" in body) update.department = body.department?.trim() || null;
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  // Reactivation consumes a seat — enforce the limit.
  if (update.is_active === true && target.is_active === false) {
    const { used, maxSeats } = await seatUsage(organizationId);
    if (maxSeats !== null && used >= maxSeats) {
      return NextResponse.json(
        { error: `All ${maxSeats} seats are in use.`, code: "SEATS_EXHAUSTED" },
        { status: 409 },
      );
    }
  }

  const { error: updErr } = await supabaseAdmin
    .from("profiles")
    .update(update)
    .eq("id", body.id);
  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  await supabaseAdmin.from("audit_log").insert({
    user_id: caller.id,
    action: "corporate.employee_updated",
    table_name: "profiles",
    record_id: body.id,
    new_values: update,
    ip_address:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    user_agent: req.headers.get("user-agent") ?? null,
  });

  return NextResponse.json({ success: true });
}
