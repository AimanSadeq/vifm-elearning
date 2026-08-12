import { NextRequest, NextResponse } from "next/server";
import { requireCorporateAdmin } from "@/lib/services/require-corporate-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { bulkAssignTraining } from "@/lib/services/training-assignment-service";

/**
 * Corporate self-service training assignment, scoped to the caller's own
 * organization (derived server-side from their profile).
 *
 * GET   list assignments for the organization's members
 * POST  bulk-assign a course or learning path to organization members
 */

async function orgMemberIds(organizationId: string): Promise<Set<string>> {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("organization_id", organizationId)
    .limit(2000);
  return new Set((data ?? []).map((p) => p.id));
}

export async function GET() {
  const { organizationId, error } = await requireCorporateAdmin();
  if (error) return error;

  const members = await orgMemberIds(organizationId);
  if (members.size === 0) return NextResponse.json({ data: [] });

  const { data, error: dbError } = await supabaseAdmin
    .from("training_assignments")
    .select(
      `id, user_id, course_id, learning_path_id, due_date, is_mandatory,
       status, completed_at, reminders_sent, created_at,
       user:profiles!training_assignments_user_id_fkey(full_name, email, department),
       course:courses(title, slug),
       learning_path:learning_paths(title, slug)`,
    )
    .in("user_id", [...members])
    .order("created_at", { ascending: false });

  if (dbError) {
    console.error("corporate training-assignments GET failed:", dbError);
    return NextResponse.json(
      { error: "Failed to load assignments" },
      { status: 500 },
    );
  }
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(req: NextRequest) {
  const { user: caller, organizationId, error } = await requireCorporateAdmin();
  if (error) return error;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const requested = Array.isArray(body.userIds)
    ? (body.userIds as string[])
    : [];
  const members = await orgMemberIds(organizationId);
  const outside = requested.filter((id) => !members.has(id));
  if (outside.length > 0) {
    return NextResponse.json(
      { error: "One or more selected users are not in your organization" },
      { status: 403 },
    );
  }

  const outcome = await bulkAssignTraining(supabaseAdmin, {
    userIds: requested,
    courseId: body.courseId as string | undefined,
    learningPathId: body.learningPathId as string | undefined,
    dueDate: body.dueDate as string | undefined,
    isMandatory: body.isMandatory as boolean | undefined,
    note: body.note as string | undefined,
    notify: body.notify as boolean | undefined,
    assignedBy: caller.id,
  });
  if (!outcome.ok) {
    return NextResponse.json({ error: outcome.error }, { status: outcome.status });
  }
  return NextResponse.json({ data: outcome.data });
}
