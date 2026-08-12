import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/services/require-super-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { bulkAssignTraining } from "@/lib/services/training-assignment-service";

// Uses the service role after requireSuperAdmin(): profile columns like email
// and department are service-role-only reads (see /api/admin/profiles), so the
// session client can't join them.

/**
 * Training assignments — admin-assigned mandatory training with due dates.
 *
 * GET  /api/admin/training-assignments   list with learner/course/path detail
 * POST /api/admin/training-assignments   bulk-assign a course or learning path
 *                                        to many users, auto-enrolling each and
 *                                        notifying them (in-app + email)
 */

export async function GET() {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const { data, error: dbError } = await supabaseAdmin
    .from("training_assignments")
    .select(
      `id, user_id, course_id, learning_path_id, due_date, is_mandatory,
       status, completed_at, note, last_reminder_at, reminders_sent, created_at,
       user:profiles!training_assignments_user_id_fkey(full_name, email, department, organization_id),
       assigner:profiles!training_assignments_assigned_by_fkey(full_name),
       course:courses(title, slug),
       learning_path:learning_paths(title, slug)`,
    )
    .order("created_at", { ascending: false });

  if (dbError) {
    console.error("training-assignments GET failed:", dbError);
    return NextResponse.json({ error: "Failed to load assignments" }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(req: NextRequest) {
  const { user: admin, error } = await requireSuperAdmin();
  if (error) return error;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const outcome = await bulkAssignTraining(supabaseAdmin, {
    userIds: (body.userIds as string[]) ?? [],
    courseId: body.courseId as string | undefined,
    learningPathId: body.learningPathId as string | undefined,
    dueDate: body.dueDate as string | undefined,
    isMandatory: body.isMandatory as boolean | undefined,
    note: body.note as string | undefined,
    notify: body.notify as boolean | undefined,
    assignedBy: admin.id,
  });

  if (!outcome.ok) {
    return NextResponse.json({ error: outcome.error }, { status: outcome.status });
  }
  return NextResponse.json({ data: outcome.data });
}
