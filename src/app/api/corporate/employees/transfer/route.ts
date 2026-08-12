import { NextRequest, NextResponse } from "next/server";
import { requireCorporateAdmin } from "@/lib/services/require-corporate-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { inviteCorporateEmployee } from "@/lib/services/corporate-employee-service";

/**
 * License transfer: replace a departed employee with a new hire at no extra
 * seat cost (EEC SOW: "licenses shall be transferable to replacement
 * employees").
 *
 * POST { fromUserId, email, fullName, fullNameAr?, department?, language? }
 *
 * 1. Deactivates the departed employee (frees their seat)
 * 2. Creates the replacement account via the normal invite flow
 * 3. Moves the departed employee's OPEN training assignments (status =
 *    'assigned') to the replacement and enrolls them; completed history
 *    stays with the original person
 * 4. Writes an audit trail entry
 */
export async function POST(req: NextRequest) {
  const { user: caller, organizationId, error } = await requireCorporateAdmin();
  if (error) return error;

  let body: {
    fromUserId?: string;
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
  if (!body.fromUserId) {
    return NextResponse.json({ error: "fromUserId is required" }, { status: 400 });
  }

  // Departing employee must be a learner in the caller's organization.
  const { data: fromUser } = await supabaseAdmin
    .from("profiles")
    .select("id, role, organization_id, full_name, email")
    .eq("id", body.fromUserId)
    .maybeSingle();
  if (
    !fromUser ||
    fromUser.organization_id !== organizationId ||
    fromUser.role !== "learner"
  ) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  // 1. Free the seat first so the invite's seat check passes net-zero.
  const { error: deacErr } = await supabaseAdmin
    .from("profiles")
    .update({ is_active: false })
    .eq("id", fromUser.id);
  if (deacErr) {
    return NextResponse.json({ error: deacErr.message }, { status: 500 });
  }

  // 2. Create the replacement through the shared invite logic.
  const invite = await inviteCorporateEmployee({
    organizationId,
    email: body.email ?? "",
    fullName: body.fullName ?? "",
    fullNameAr: body.fullNameAr,
    department: body.department,
    language: body.language,
  });
  if (!invite.ok) {
    // Roll back the deactivation so a failed transfer leaves things as before.
    await supabaseAdmin
      .from("profiles")
      .update({ is_active: true })
      .eq("id", fromUser.id);
    return NextResponse.json(
      { error: invite.error },
      { status: invite.status },
    );
  }
  const newUserId: string = invite.data.id;

  // 3. Move open training assignments to the replacement + enroll them.
  const { data: openAssignments } = await supabaseAdmin
    .from("training_assignments")
    .select("id, course_id, learning_path_id")
    .eq("user_id", fromUser.id)
    .eq("status", "assigned");

  let moved = 0;
  for (const a of openAssignments ?? []) {
    const { error: moveErr } = await supabaseAdmin
      .from("training_assignments")
      .update({ user_id: newUserId })
      .eq("id", a.id);
    if (moveErr) {
      console.error(`transfer: could not move assignment ${a.id}`, moveErr);
      continue;
    }
    moved++;
    if (a.course_id) {
      await supabaseAdmin.from("enrollments").upsert(
        {
          user_id: newUserId,
          course_id: a.course_id,
          status: "active",
          enrolled_at: new Date().toISOString(),
        },
        { onConflict: "user_id,course_id", ignoreDuplicates: true },
      );
    } else if (a.learning_path_id) {
      await supabaseAdmin.from("learning_path_enrollments").upsert(
        {
          learning_path_id: a.learning_path_id,
          user_id: newUserId,
          status: "active",
        },
        { onConflict: "learning_path_id,user_id", ignoreDuplicates: true },
      );
    }
  }

  // 4. Audit trail.
  await supabaseAdmin.from("audit_log").insert({
    user_id: caller.id,
    action: "corporate.license_transferred",
    table_name: "profiles",
    record_id: newUserId,
    new_values: {
      from_user_id: fromUser.id,
      from_email: fromUser.email,
      to_email: invite.data.email,
      assignments_moved: moved,
      organization_id: organizationId,
    },
    ip_address:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    user_agent: req.headers.get("user-agent") ?? null,
  });

  return NextResponse.json({
    data: {
      newUserId,
      email: invite.data.email,
      emailed: invite.data.emailed,
      tempPassword: invite.data.tempPassword,
      assignmentsMoved: moved,
    },
  });
}
