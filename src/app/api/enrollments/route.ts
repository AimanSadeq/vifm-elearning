import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { userHasActiveSubscription } from "@/lib/services/access";

export async function POST(request: NextRequest) {
  try {
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

    // Idempotent: return existing enrollment if any
    const { data: existing } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ data: existing }, { status: 200 });
    }

    const { data: enrollment, error: enrollError } = await supabase
      .from("enrollments")
      .insert({
        user_id: user.id,
        course_id: courseId,
        status: "active",
        enrolled_at: new Date().toISOString(),
        metadata: !course.is_free && !isAdmin
          ? { source: "subscription" }
          : {},
      })
      .select()
      .single();

    if (enrollError) {
      return NextResponse.json(
        { error: `Failed to enroll: ${enrollError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: enrollment }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
