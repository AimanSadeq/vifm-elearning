import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  issueCertificate,
  SurveyRequiredError,
  KnowledgeCheckRequiredError,
} from "@/lib/services/certificate-service";
import { escapeIlike } from "@/lib/utils/escape-search";

import { getOwnRole } from "@/lib/supabase/own-profile";
import { supabaseAdmin } from "@/lib/supabase/admin";
/**
 * Issue certificates for completed, certificate-enabled courses that don't
 * have one yet. Self-heals older completions where the buggy progress gate
 * never fired the auto-issue. Idempotent (issueCertificate returns the
 * existing cert) and survey-gated (blocked ones stay blocked).
 */
async function issueMissingCertificates(userId: string) {
  const { data: enrollments } = await supabaseAdmin
    .from("enrollments")
    .select(
      "id, course_id, course:courses!enrollments_course_id_fkey(certificate_enabled)",
    )
    .eq("user_id", userId)
    .eq("status", "completed");
  if (!enrollments?.length) return;

  const { data: existing } = await supabaseAdmin
    .from("certificates")
    .select("course_id")
    .eq("user_id", userId);
  const haveCert = new Set((existing ?? []).map((c) => c.course_id as string));

  for (const e of enrollments) {
    const courseId = e.course_id as string;
    if (haveCert.has(courseId)) continue;
    const rel = e.course as unknown as
      | { certificate_enabled?: boolean }
      | { certificate_enabled?: boolean }[]
      | null;
    const course = Array.isArray(rel) ? rel[0] : rel;
    if (!course?.certificate_enabled) continue;
    try {
      await issueCertificate({
        userId,
        courseId,
        enrollmentId: e.id as string,
      });
    } catch {
      // SurveyRequiredError or transient — the survey banner covers it.
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Own role — read via my_profile; `profiles.role` is not granted
    // to `authenticated` any more.
    const profile = { role: await getOwnRole(supabase) };

    const isAdmin = profile?.role === "super_admin";

    // Self-heal any missing certificates for this learner's completed courses
    // before listing, so they appear immediately.
    await issueMissingCertificates(user.id).catch(() => {});

    const params = request.nextUrl.searchParams;
    const page = Math.max(0, Number(params.get("page") ?? "0") || 0);
    const pageSize = Math.min(
      100,
      Math.max(1, Number(params.get("pageSize") ?? "25") || 25)
    );
    const from = page * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("certificates")
      .select(
        "*, course:courses(title, title_ar, slug), user:profiles!certificates_user_id_fkey(full_name)",
        { count: "exact" }
      )
      .order("issued_at", { ascending: false })
      .range(from, to);

    if (!isAdmin) {
      query = query.eq("user_id", user.id);
    }

    // Cap search input length before passing to PostgREST. Without a cap
    // a 1MB `?search=` payload happily flows through, wasting the trip
    // and shifting cost onto the DB.
    const search = params.get("search")?.slice(0, 200);
    if (search) {
      const s = escapeIlike(search);
      query = query.or(
        `certificate_number.ilike.%${s}%,verification_code.ilike.%${s}%`
      );
    }

    const { data, error, count } = await query;
    if (error) {
      console.error("certificates list failed", error);
      return NextResponse.json(
        { error: "Could not load certificates" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data, count: count ?? 0 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Own role — read via my_profile; `profiles.role` is not granted
    // to `authenticated` any more.
    const profile = { role: await getOwnRole(supabase) };

    if (profile?.role !== "super_admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { userId, courseId } = await request.json();
    if (!userId || !courseId)
      return NextResponse.json(
        { error: "userId and courseId are required" },
        { status: 400 }
      );

    // Find enrollment
    const { data: enrollment } = await supabaseAdmin
      .from("enrollments")
      .select("id")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .single();

    if (!enrollment)
      return NextResponse.json(
        { error: "No enrollment found" },
        { status: 400 }
      );

    const certificate = await issueCertificate({
      userId,
      courseId,
      enrollmentId: enrollment.id,
    });

    return NextResponse.json({ data: certificate }, { status: 201 });
  } catch (err) {
    if (err instanceof SurveyRequiredError) {
      return NextResponse.json(
        { error: err.message, code: "SURVEY_REQUIRED" },
        { status: 409 }
      );
    }
    if (err instanceof KnowledgeCheckRequiredError) {
      return NextResponse.json(
        { error: err.message, code: "KNOWLEDGE_CHECKS_REQUIRED" },
        { status: 409 }
      );
    }
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
