import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createEnrollmentFromPayment } from "@/lib/services/enrollment-service";

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
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

    // Verify course is free
    const { data: course } = await supabaseAdmin
      .from("courses")
      .select("id, is_free, status")
      .eq("id", courseId)
      .single();

    if (!course)
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );

    if (!course.is_free)
      return NextResponse.json(
        { error: "This course requires payment" },
        { status: 400 }
      );

    if (course.status !== "published")
      return NextResponse.json(
        { error: "Course is not available" },
        { status: 400 }
      );

    const enrollment = await createEnrollmentFromPayment({
      userId: user.id,
      courseId,
    });

    return NextResponse.json({ data: enrollment }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
