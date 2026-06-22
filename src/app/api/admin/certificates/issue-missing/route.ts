import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  issueCertificate,
  SurveyRequiredError,
} from "@/lib/services/certificate-service";

export const runtime = "nodejs";

// Each issued cert renders + uploads a file, so bound the work per request to
// stay under the serverless timeout. The admin can click again for more.
const BATCH = 25;

/**
 * POST /api/admin/certificates/issue-missing
 *
 * Issues certificates for completed, certificate-enabled enrollments that
 * don't have one yet (recovers completions where the buggy progress gate never
 * fired the auto-issue). Idempotent and survey-gated. Processes up to BATCH per
 * call and reports whether more remain.
 */
export async function POST() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: enrollments } = await supabaseAdmin
    .from("enrollments")
    .select(
      "id, user_id, course_id, course:courses!enrollments_course_id_fkey(certificate_enabled)",
    )
    .eq("status", "completed");

  const certEnabled = (enrollments ?? []).filter((e) => {
    const rel = e.course as unknown as
      | { certificate_enabled?: boolean }
      | { certificate_enabled?: boolean }[]
      | null;
    const c = Array.isArray(rel) ? rel[0] : rel;
    return Boolean(c?.certificate_enabled);
  });

  const { data: certs } = await supabaseAdmin
    .from("certificates")
    .select("user_id, course_id");
  const have = new Set(
    (certs ?? []).map((c) => `${c.user_id}:${c.course_id}`),
  );

  const missing = certEnabled.filter(
    (e) => !have.has(`${e.user_id}:${e.course_id}`),
  );
  const batch = missing.slice(0, BATCH);

  let issued = 0;
  let blocked = 0;
  let failed = 0;
  for (const e of batch) {
    try {
      await issueCertificate({
        userId: e.user_id as string,
        courseId: e.course_id as string,
        enrollmentId: e.id as string,
      });
      issued += 1;
    } catch (err) {
      if (err instanceof SurveyRequiredError) blocked += 1;
      else failed += 1;
    }
  }

  return NextResponse.json({
    data: {
      totalMissing: missing.length,
      processed: batch.length,
      issued,
      blocked,
      failed,
      more: missing.length > batch.length,
    },
  });
}
