import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

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

    // Verify course exists, is free, and is published
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

    // Admins can enroll in any course without payment
    const isAdmin = user.app_metadata?.role === "super_admin";

    if (!course.is_free && !isAdmin)
      return NextResponse.json(
        { error: "This course requires payment" },
        { status: 400 }
      );

    if (course.status !== "published" && !isAdmin)
      return NextResponse.json(
        { error: "Course is not available" },
        { status: 400 }
      );

    // Check if already enrolled
    const { data: existing } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .single();

    if (existing) {
      return NextResponse.json({ data: existing }, { status: 200 });
    }

    // Create enrollment
    const { data: enrollment, error: enrollError } = await supabase
      .from("enrollments")
      .insert({
        user_id: user.id,
        course_id: courseId,
        status: "active",
        enrolled_at: new Date().toISOString(),
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
