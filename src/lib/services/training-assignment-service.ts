import type { SupabaseClient } from "@supabase/supabase-js";
import { sendTrainingAssignedEmail } from "@/lib/services/email";
import { env } from "@/lib/env";

/**
 * Bulk training assignment, shared by the super-admin route
 * (/api/admin/training-assignments) and the corporate route
 * (/api/corporate/training-assignments). Callers are responsible for
 * AUTHORIZATION (who may assign to whom); this service validates the
 * input shape, creates assignment rows, auto-enrolls, and notifies.
 *
 * Pass a service-role client — profile columns like email are not granted
 * to `authenticated`.
 */

export interface BulkAssignInput {
  userIds: string[];
  courseId?: string;
  learningPathId?: string;
  /** YYYY-MM-DD */
  dueDate?: string;
  isMandatory?: boolean;
  note?: string;
  /** default true */
  notify?: boolean;
  assignedBy: string;
}

export interface BulkAssignResult {
  assigned: number;
  skipped: number;
  notified: number;
  errors: string[];
}

export type BulkAssignOutcome =
  | { ok: true; data: BulkAssignResult }
  | { ok: false; status: number; error: string };

export async function bulkAssignTraining(
  db: SupabaseClient,
  input: BulkAssignInput,
): Promise<BulkAssignOutcome> {
  const userIds = Array.isArray(input.userIds)
    ? [...new Set(input.userIds.filter((id) => typeof id === "string" && id))]
    : [];
  const hasCourse =
    typeof input.courseId === "string" && input.courseId.length > 0;
  const hasPath =
    typeof input.learningPathId === "string" && input.learningPathId.length > 0;

  if (userIds.length === 0) {
    return { ok: false, status: 400, error: "userIds is required" };
  }
  if (hasCourse === hasPath) {
    return {
      ok: false,
      status: 400,
      error: "Provide exactly one of courseId or learningPathId",
    };
  }
  if (input.dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(input.dueDate)) {
    return { ok: false, status: 400, error: "dueDate must be YYYY-MM-DD" };
  }

  // Resolve the target's title/slug once — also validates the id exists.
  let target: { title: string; slug: string };
  if (hasCourse) {
    const { data } = await db
      .from("courses")
      .select("title, title_ar, slug")
      .eq("id", input.courseId!)
      .maybeSingle();
    if (!data) return { ok: false, status: 404, error: "Course not found" };
    target = { title: data.title ?? data.title_ar ?? "Course", slug: data.slug };
  } else {
    const { data } = await db
      .from("learning_paths")
      .select("title, title_ar, slug")
      .eq("id", input.learningPathId!)
      .maybeSingle();
    if (!data)
      return { ok: false, status: 404, error: "Learning path not found" };
    target = {
      title: data.title ?? data.title_ar ?? "Learning path",
      slug: data.slug,
    };
  }

  const { data: profiles } = await db
    .from("profiles")
    .select("id, full_name, email, language")
    .in("id", userIds);
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  // Existing live assignments for this target — skip, don't duplicate.
  const targetCol = hasCourse ? "course_id" : "learning_path_id";
  const targetId = hasCourse ? input.courseId! : input.learningPathId!;
  const { data: existing } = await db
    .from("training_assignments")
    .select("user_id")
    .eq(targetCol, targetId)
    .neq("status", "cancelled")
    .in("user_id", userIds);
  const alreadyAssigned = new Set((existing ?? []).map((e) => e.user_id));

  const results: BulkAssignResult = {
    assigned: 0,
    skipped: 0,
    notified: 0,
    errors: [],
  };
  const notify = input.notify !== false;
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

    const { error: insertErr } = await db.from("training_assignments").insert({
      user_id: userId,
      course_id: hasCourse ? input.courseId : null,
      learning_path_id: hasPath ? input.learningPathId : null,
      assigned_by: input.assignedBy,
      due_date: input.dueDate ?? null,
      is_mandatory: input.isMandatory ?? true,
      note: input.note ?? null,
    });
    if (insertErr) {
      results.errors.push(`${profile.email}: ${insertErr.message}`);
      continue;
    }
    results.assigned++;

    // Auto-enroll so the training shows up in the learner's active learning.
    if (hasCourse) {
      const { error: enrollErr } = await db.from("enrollments").upsert(
        {
          user_id: userId,
          course_id: input.courseId!,
          status: "active",
          enrolled_at: new Date().toISOString(),
        },
        { onConflict: "user_id,course_id", ignoreDuplicates: true },
      );
      if (enrollErr) {
        results.errors.push(
          `${profile.email}: enrollment failed (${enrollErr.message})`,
        );
      }
    } else {
      const { error: enrollErr } = await db
        .from("learning_path_enrollments")
        .upsert(
          {
            learning_path_id: input.learningPathId!,
            user_id: userId,
            status: "active",
          },
          { onConflict: "learning_path_id,user_id", ignoreDuplicates: true },
        );
      if (enrollErr) {
        results.errors.push(
          `${profile.email}: enrollment failed (${enrollErr.message})`,
        );
      }
    }

    if (!notify) continue;

    const locale = profile.language === "ar" ? "ar" : "en";
    const trainingPath = hasCourse
      ? `/${locale}/courses/${target.slug}`
      : `/${locale}/learning-paths/${target.slug}`;

    await db.from("notifications").insert({
      user_id: userId,
      title: "New training assigned",
      title_ar: "تم تعيين تدريب جديد",
      body: input.dueDate
        ? `You have been assigned "${target.title}". Due by ${input.dueDate}.`
        : `You have been assigned "${target.title}".`,
      body_ar: input.dueDate
        ? `تم تعيين "${target.title}" لك. تاريخ الاستحقاق ${input.dueDate}.`
        : `تم تعيين "${target.title}" لك.`,
      channel: "in_app",
      action_url: trainingPath,
    });

    try {
      const sent = await sendTrainingAssignedEmail({
        to: profile.email,
        userName: profile.full_name ?? profile.email,
        trainingTitle: target.title,
        dueDate: input.dueDate ?? undefined,
        trainingUrl: `${appUrl}${trainingPath}`,
      });
      if (sent.success) results.notified++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "email send failed";
      results.errors.push(`${profile.email}: ${msg}`);
    }
  }

  return { ok: true, data: results };
}
