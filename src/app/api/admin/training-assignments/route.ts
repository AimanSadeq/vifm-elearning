import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/services/require-super-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendTrainingAssignedEmail } from "@/lib/services/email";
import { env } from "@/lib/env";

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
  const supabase = supabaseAdmin;

  const { data, error: dbError } = await supabase
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

interface AssignBody {
  userIds: string[];
  courseId?: string;
  learningPathId?: string;
  dueDate?: string; // YYYY-MM-DD
  isMandatory?: boolean;
  note?: string;
  notify?: boolean; // default true
}

export async function POST(req: NextRequest) {
  const { user: admin, error } = await requireSuperAdmin();
  if (error) return error;
  const supabase = supabaseAdmin;

  let body: AssignBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const userIds = Array.isArray(body.userIds)
    ? [...new Set(body.userIds.filter((id) => typeof id === "string" && id))]
    : [];
  const hasCourse = typeof body.courseId === "string" && body.courseId.length > 0;
  const hasPath =
    typeof body.learningPathId === "string" && body.learningPathId.length > 0;

  if (userIds.length === 0) {
    return NextResponse.json({ error: "userIds is required" }, { status: 400 });
  }
  if (hasCourse === hasPath) {
    return NextResponse.json(
      { error: "Provide exactly one of courseId or learningPathId" },
      { status: 400 },
    );
  }
  if (body.dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(body.dueDate)) {
    return NextResponse.json(
      { error: "dueDate must be YYYY-MM-DD" },
      { status: 400 },
    );
  }

  // Resolve the target's title/slug once — also validates the id exists.
  let target: { title: string; slug: string };
  if (hasCourse) {
    const { data } = await supabase
      .from("courses")
      .select("title, title_ar, slug")
      .eq("id", body.courseId!)
      .maybeSingle();
    if (!data) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    target = { title: data.title ?? data.title_ar ?? "Course", slug: data.slug };
  } else {
    const { data } = await supabase
      .from("learning_paths")
      .select("title, title_ar, slug")
      .eq("id", body.learningPathId!)
      .maybeSingle();
    if (!data) {
      return NextResponse.json(
        { error: "Learning path not found" },
        { status: 404 },
      );
    }
    target = {
      title: data.title ?? data.title_ar ?? "Learning path",
      slug: data.slug,
    };
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, language")
    .in("id", userIds);
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  // Existing live assignments for this target — skip, don't duplicate.
  const targetCol = hasCourse ? "course_id" : "learning_path_id";
  const targetId = hasCourse ? body.courseId! : body.learningPathId!;
  const { data: existing } = await supabase
    .from("training_assignments")
    .select("user_id")
    .eq(targetCol, targetId)
    .neq("status", "cancelled")
    .in("user_id", userIds);
  const alreadyAssigned = new Set((existing ?? []).map((e) => e.user_id));

  const results = { assigned: 0, skipped: 0, notified: 0, errors: [] as string[] };
  const notify = body.notify !== false;
  const appUrl = env.NEXT_PUBLIC_APP_URL ?? "";

  for (const userId of userIds) {
    const profile = profileById.get(userId);
    if (!profile) {
      results.errors.push(`User ${userId} not found`);
      continue;
    }
    if (alreadyAssigned.has(userId)) {
      results.skipped++;
      continue;
    }

    const { error: insertErr } = await supabase
      .from("training_assignments")
      .insert({
        user_id: userId,
        course_id: hasCourse ? body.courseId : null,
        learning_path_id: hasPath ? body.learningPathId : null,
        assigned_by: admin.id,
        due_date: body.dueDate ?? null,
        is_mandatory: body.isMandatory ?? true,
        note: body.note ?? null,
      });
    if (insertErr) {
      results.errors.push(`${profile.email}: ${insertErr.message}`);
      continue;
    }
    results.assigned++;

    // Auto-enroll so the training shows up in the learner's active learning.
    if (hasCourse) {
      const { error: enrollErr } = await supabase
        .from("enrollments")
        .upsert(
          {
            user_id: userId,
            course_id: body.courseId!,
            status: "active",
            enrolled_at: new Date().toISOString(),
          },
          { onConflict: "user_id,course_id", ignoreDuplicates: true },
        );
      if (enrollErr) {
        results.errors.push(`${profile.email}: enrollment failed (${enrollErr.message})`);
      }
    } else {
      const { error: enrollErr } = await supabase
        .from("learning_path_enrollments")
        .upsert(
          {
            learning_path_id: body.learningPathId!,
            user_id: userId,
            status: "active",
          },
          { onConflict: "learning_path_id,user_id", ignoreDuplicates: true },
        );
      if (enrollErr) {
        results.errors.push(`${profile.email}: enrollment failed (${enrollErr.message})`);
      }
    }

    if (!notify) continue;

    const locale = profile.language === "ar" ? "ar" : "en";
    const trainingPath = hasCourse
      ? `/${locale}/courses/${target.slug}`
      : `/${locale}/learning-paths/${target.slug}`;

    await supabase.from("notifications").insert({
      user_id: userId,
      title: "New training assigned",
      title_ar: "تم تعيين تدريب جديد",
      body: body.dueDate
        ? `You have been assigned "${target.title}". Due by ${body.dueDate}.`
        : `You have been assigned "${target.title}".`,
      body_ar: body.dueDate
        ? `تم تعيين "${target.title}" لك. تاريخ الاستحقاق ${body.dueDate}.`
        : `تم تعيين "${target.title}" لك.`,
      channel: "in_app",
      action_url: trainingPath,
    });

    try {
      const sent = await sendTrainingAssignedEmail({
        to: profile.email,
        userName: profile.full_name ?? profile.email,
        trainingTitle: target.title,
        dueDate: body.dueDate ?? undefined,
        trainingUrl: `${appUrl}${trainingPath}`,
      });
      if (sent.success) results.notified++;
    } catch (e) {
      // Email failure shouldn't fail the assignment — surface it in the summary.
      const msg = e instanceof Error ? e.message : "email send failed";
      results.errors.push(`${profile.email}: ${msg}`);
    }
  }

  return NextResponse.json({ data: results });
}
