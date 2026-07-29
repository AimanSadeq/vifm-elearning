import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { userHasActiveSubscription } from "@/lib/services/access";
import { applyRateLimit } from "@/lib/utils/rate-limit";

import { supabaseAdmin } from "@/lib/supabase/admin";
export async function POST(request: NextRequest) {
  try {
    const limited = await applyRateLimit(request, {
      scope: "enrollments:create",
      buckets: [
        { limit: 10, windowMs: 60_000 },
        { limit: 60, windowMs: 60 * 60_000 },
      ],
    });
    if (limited) return limited;

    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { courseId } = await request.json();
    if (!courseId)
      return NextResponse.json(
        { error: "courseId is required" },
        { status: 400 }
      );

    // Verify course exists and is published
    const { data: course } = await supabase
      .from("courses")
      .select("id, is_free, status")
      .eq("id", courseId)
      .single();

    if (!course)
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );

    const isAdmin = user.app_metadata?.role === "super_admin";

    if (course.status !== "published" && !isAdmin)
      return NextResponse.json(
        { error: "Course is not available" },
        { status: 400 }
      );

    // Free / admin / paid → always allowed
    // Paid → also allowed if the user has an active subscription
    if (!course.is_free && !isAdmin) {
      const hasSub = await userHasActiveSubscription(user.id, supabase);
      if (!hasSub)
        return NextResponse.json(
          { error: "This course requires payment or an active subscription" },
          { status: 400 }
        );
    }

    // Direct INSERT on enrollments is revoked — a client could otherwise write
    // itself into any paid course. enrol_in_course() is a SECURITY DEFINER RPC
    // that re-checks free / paid / subscription / staff server-side and is
    // idempotent: it returns the existing row rather than raising.
    // enrol_in_course returns `public.enrollments` — a composite, not a set —
    // so PostgREST hands back the object directly. No .single().
    const { data: enrollment, error: enrollError } = await supabase.rpc(
      "enrol_in_course",
      { p_course_id: courseId }
    );

    if (enrollError) {
      // 42501 is the RPC's "payment required" / "not authenticated" path.
      const denied = enrollError.code === "42501";
      return NextResponse.json(
        { error: denied ? "This course requires payment or an active subscription" : `Failed to enroll: ${enrollError.message}` },
        { status: denied ? 400 : 500 }
      );
    }

    // Provenance for the analytics views. enrollments.metadata is not in the
    // client's update grant, so this goes through the service role.
    if (!course.is_free && !isAdmin && enrollment) {
      await supabaseAdmin
        .from("enrollments")
        .update({ metadata: { source: "subscription" } })
        .eq("id", (enrollment as { id: string }).id);
    }

    return NextResponse.json({ data: enrollment }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
