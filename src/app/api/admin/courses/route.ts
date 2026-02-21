import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user via Authorization header (Bearer token)
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    console.log("[admin/courses] Service role key starts with:", serviceKey.substring(0, 10), "length:", serviceKey.length);
    console.log("[admin/courses] Auth header present:", !!authHeader);
    console.log("[admin/courses] Token length:", token?.length ?? 0);

    if (!token) {
      return NextResponse.json({ error: "Unauthorized - no token" }, { status: 401 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    console.log("[admin/courses] Auth result:", { userId: user?.id, authError: authError?.message });

    if (authError || !user) {
      return NextResponse.json({ error: `Unauthorized - ${authError?.message || "no user"}` }, { status: 401 });
    }

    // Verify user has super_admin role
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse multipart form data
    const formData = await request.formData();
    const courseDataJson = formData.get("courseData") as string;
    const thumbnailFile = formData.get("thumbnail") as File | null;

    if (!courseDataJson) {
      return NextResponse.json(
        { error: "courseData is required" },
        { status: 400 }
      );
    }

    const { mode, courseId: existingCourseId, ...coursePayload } = JSON.parse(courseDataJson);

    let courseId: string;

    if (mode === "edit" && existingCourseId) {
      courseId = existingCourseId;
      const { error } = await supabaseAdmin
        .from("courses")
        .update(coursePayload)
        .eq("id", courseId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      const { data: created, error } = await supabaseAdmin
        .from("courses")
        .insert(coursePayload)
        .select("id")
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      courseId = created.id;
    }

    // Upload thumbnail if provided
    if (thumbnailFile && thumbnailFile.size > 0) {
      const fileExt = thumbnailFile.name.split(".").pop();
      const filePath = `courses/${courseId}/thumbnail.${fileExt}`;
      const arrayBuffer = await thumbnailFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: uploadError } = await supabaseAdmin.storage
        .from("course-assets")
        .upload(filePath, buffer, {
          upsert: true,
          contentType: thumbnailFile.type,
        });

      if (uploadError) {
        console.error("Thumbnail upload error:", uploadError);
        // Course was still created, just thumbnail failed
      } else {
        const { data: urlData } = supabaseAdmin.storage
          .from("course-assets")
          .getPublicUrl(filePath);

        await supabaseAdmin
          .from("courses")
          .update({ thumbnail_url: urlData.publicUrl })
          .eq("id", courseId);
      }
    }

    return NextResponse.json({ data: { id: courseId } }, { status: 201 });
  } catch (err) {
    console.error("Admin course creation error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
