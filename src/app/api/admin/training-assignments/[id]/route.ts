import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/services/require-super-admin";
import { createServerSupabase } from "@/lib/supabase/server";

// Uses the admin's session client — RLS (is_admin()) provides full access and
// local dev works without SUPABASE_SERVICE_ROLE_KEY.

/**
 * PATCH  /api/admin/training-assignments/[id]  update due date / mandatory /
 *                                              note / status (cancel, re-open)
 * DELETE /api/admin/training-assignments/[id]  remove the assignment record
 *                                              (does not unenroll the learner)
 */

const ALLOWED_STATUSES = new Set(["assigned", "cancelled"]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireSuperAdmin();
  if (error) return error;
  const { id } = await params;
  const supabase = await createServerSupabase();

  let body: {
    dueDate?: string | null;
    isMandatory?: boolean;
    note?: string | null;
    status?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if ("dueDate" in body) {
    if (body.dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(body.dueDate)) {
      return NextResponse.json(
        { error: "dueDate must be YYYY-MM-DD" },
        { status: 400 },
      );
    }
    update.due_date = body.dueDate ?? null;
  }
  if ("isMandatory" in body) update.is_mandatory = Boolean(body.isMandatory);
  if ("note" in body) update.note = body.note ?? null;
  if ("status" in body) {
    if (!ALLOWED_STATUSES.has(body.status ?? "")) {
      return NextResponse.json(
        { error: "status must be 'assigned' or 'cancelled'" },
        { status: 400 },
      );
    }
    update.status = body.status;
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { data, error: dbError } = await supabase
    .from("training_assignments")
    .update(update)
    .eq("id", id)
    .select("id, status, due_date, is_mandatory, note")
    .maybeSingle();

  if (dbError) {
    console.error("training-assignments PATCH failed:", dbError);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }
  return NextResponse.json({ data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireSuperAdmin();
  if (error) return error;
  const { id } = await params;
  const supabase = await createServerSupabase();

  const { error: dbError, count } = await supabase
    .from("training_assignments")
    .delete({ count: "exact" })
    .eq("id", id);

  if (dbError) {
    console.error("training-assignments DELETE failed:", dbError);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }
  if (!count) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
