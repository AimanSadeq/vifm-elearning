import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendTrainingReminderEmail } from "@/lib/services/email";
import { env } from "@/lib/env";

/**
 * Daily cron: training-assignment completion sync + due-date reminders.
 *
 * 1. Completion sync — assignments whose underlying enrollment (course) or
 *    learning-path enrollment is completed are marked completed.
 * 2. Reminders — for open assignments with a due date within 7 days (or
 *    overdue), send an email + in-app notification. Throttled per assignment:
 *    a reminder goes out at most once every 6 days, which yields roughly a
 *    "7 days out, 1 day out, weekly while overdue" cadence on a daily cron.
 *
 * Auth: CRON_SECRET header (x-cron-secret). `?dry=1` reports what would be
 * sent without sending or writing anything.
 */

function verifyCronSecret(header: string | null): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected || !header) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

const REMIND_WINDOW_DAYS = 7;
const THROTTLE_MS = 6 * 24 * 60 * 60 * 1000;

type Ref = { title: string | null; title_ar: string | null; slug: string | null } | null;
type ProfileRef = {
  full_name: string | null;
  email: string | null;
  language: string | null;
} | null;
const pickOne = <T,>(v: T | T[] | null | undefined): T | null =>
  Array.isArray(v) ? (v[0] ?? null) : (v ?? null);

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req.headers.get("x-cron-secret"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dryRun = req.nextUrl.searchParams.get("dry") === "1";

  const now = new Date();
  const nowIso = now.toISOString();
  const results = {
    completedSynced: 0,
    remindersSent: 0,
    remindersSkipped: 0,
    errors: 0,
    dryRun,
  };

  try {
    // ------------------------------------------------------------------
    // 1. Fetch open assignments with learner + target detail.
    // ------------------------------------------------------------------
    const { data: open, error: openErr } = await supabaseAdmin
      .from("training_assignments")
      .select(
        `id, user_id, course_id, learning_path_id, due_date, last_reminder_at,
         reminders_sent,
         user:profiles!training_assignments_user_id_fkey(full_name, email, language),
         course:courses(title, title_ar, slug),
         learning_path:learning_paths(title, title_ar, slug)`,
      )
      .eq("status", "assigned");

    if (openErr) {
      console.error("training-reminders: failed to load assignments", openErr);
      return NextResponse.json(
        { error: "Failed to load assignments" },
        { status: 500 },
      );
    }
    const assignments = open ?? [];
    if (assignments.length === 0) {
      return NextResponse.json({ success: true, timestamp: nowIso, ...results });
    }

    // ------------------------------------------------------------------
    // 2. Completion sync.
    // ------------------------------------------------------------------
    const userIds = [...new Set(assignments.map((a) => a.user_id))];

    const [{ data: doneCourses }, { data: donePaths }] = await Promise.all([
      supabaseAdmin
        .from("enrollments")
        .select("user_id, course_id, completed_at")
        .eq("status", "completed")
        .in("user_id", userIds),
      supabaseAdmin
        .from("learning_path_enrollments")
        .select("user_id, learning_path_id, completed_at")
        .eq("status", "completed")
        .in("user_id", userIds),
    ]);

    const doneCourseSet = new Map(
      (doneCourses ?? []).map((e) => [`${e.user_id}:${e.course_id}`, e.completed_at]),
    );
    const donePathSet = new Map(
      (donePaths ?? []).map((e) => [
        `${e.user_id}:${e.learning_path_id}`,
        e.completed_at,
      ]),
    );

    const stillOpen: typeof assignments = [];
    for (const a of assignments) {
      const key = a.course_id
        ? doneCourseSet.get(`${a.user_id}:${a.course_id}`)
        : donePathSet.get(`${a.user_id}:${a.learning_path_id}`);
      if (key !== undefined) {
        if (!dryRun) {
          const { error: updErr } = await supabaseAdmin
            .from("training_assignments")
            .update({ status: "completed", completed_at: key ?? nowIso })
            .eq("id", a.id);
          if (updErr) {
            console.error(`training-reminders: completion sync failed for ${a.id}`, updErr);
            results.errors++;
            continue;
          }
        }
        results.completedSynced++;
      } else {
        stillOpen.push(a);
      }
    }

    // ------------------------------------------------------------------
    // 3. Reminders for open assignments with a due date within the window.
    // ------------------------------------------------------------------
    const appUrl = env.NEXT_PUBLIC_APP_URL ?? "";
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    for (const a of stillOpen) {
      if (!a.due_date) continue;

      const due = new Date(`${a.due_date}T00:00:00`);
      const daysUntil = Math.round(
        (due.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
      );
      if (daysUntil > REMIND_WINDOW_DAYS) continue;

      const lastReminder = a.last_reminder_at
        ? new Date(a.last_reminder_at).getTime()
        : null;
      if (lastReminder && now.getTime() - lastReminder < THROTTLE_MS) {
        results.remindersSkipped++;
        continue;
      }

      const profile = pickOne(a.user as ProfileRef | ProfileRef[]);
      if (!profile?.email) {
        results.errors++;
        continue;
      }
      const target = a.course_id
        ? pickOne(a.course as Ref | Ref[])
        : pickOne(a.learning_path as Ref | Ref[]);
      const title = target?.title ?? target?.title_ar ?? "Assigned training";
      const locale = profile.language === "ar" ? "ar" : "en";
      const trainingPath = a.course_id
        ? `/${locale}/courses/${target?.slug ?? ""}`
        : `/${locale}/learning-paths/${target?.slug ?? ""}`;
      const isOverdue = daysUntil < 0;

      if (dryRun) {
        results.remindersSent++;
        continue;
      }

      try {
        await sendTrainingReminderEmail({
          to: profile.email,
          userName: profile.full_name ?? profile.email,
          trainingTitle: title,
          dueDate: a.due_date,
          isOverdue,
          trainingUrl: `${appUrl}${trainingPath}`,
        });

        await supabaseAdmin.from("notifications").insert({
          user_id: a.user_id,
          title: isOverdue ? "Training overdue" : "Training due soon",
          title_ar: isOverdue ? "التدريب متأخر" : "موعد استحقاق التدريب يقترب",
          body: isOverdue
            ? `"${title}" was due on ${a.due_date}. Please complete it as soon as possible.`
            : `"${title}" is due on ${a.due_date}.`,
          body_ar: isOverdue
            ? `كان موعد استحقاق "${title}" في ${a.due_date}. يرجى إكماله في أقرب وقت.`
            : `موعد استحقاق "${title}" هو ${a.due_date}.`,
          channel: "in_app",
          action_url: trainingPath,
        });

        await supabaseAdmin
          .from("training_assignments")
          .update({
            last_reminder_at: nowIso,
            reminders_sent: (a.reminders_sent ?? 0) + 1,
          })
          .eq("id", a.id);

        results.remindersSent++;
      } catch (e) {
        console.error(`training-reminders: send failed for assignment ${a.id}`, e);
        results.errors++;
      }
    }

    return NextResponse.json({ success: true, timestamp: nowIso, ...results });
  } catch (err) {
    console.error("Training reminders cron error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
