import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";

/** Strict allow-list of columns admins may set on `courses`. Anything not
 *  here (id, slug, enrollment_count, average_rating, *_at, etc.) is
 *  silently dropped — counters/timestamps are managed by the DB and slug
 *  is generated server-side, so leaving them client-settable is how you
 *  end up with admins overwriting another instructor's course. */
const courseUpsertSchema = z.object({
  title: z.string().max(300).nullable().optional(),
  title_ar: z.string().max(300).nullable().optional(),
  description: z.string().max(20_000).nullable().optional(),
  description_ar: z.string().max(20_000).nullable().optional(),
  short_description: z.string().max(500).nullable().optional(),
  short_description_ar: z.string().max(500).nullable().optional(),
  preview_video_url: z.string().url().max(2048).nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  instructor_id: z.string().uuid().nullable().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  difficulty_level: z
    .enum(["gateway", "professional", "executive", "expert"])
    .nullable()
    .optional(),
  tier_level: z
    .enum(["gateway", "professional", "executive"])
    .nullable()
    .optional(),
  duration_hours: z.number().int().min(0).max(10_000).nullable().optional(),
  price: z.number().min(0).max(1_000_000).optional(),
  currency: z.string().length(3).optional(),
  is_featured: z.boolean().optional(),
  is_free: z.boolean().optional(),
  prerequisites: z.array(z.string().max(500)).max(50).nullable().optional(),
  learning_outcomes: z.array(z.string().max(500)).max(50).nullable().optional(),
  learning_outcomes_ar: z.array(z.string().max(500)).max(50).nullable().optional(),
  tags: z.array(z.string().max(100)).max(50).nullable().optional(),
  max_enrollment: z.number().int().min(0).max(1_000_000).nullable().optional(),
  certificate_enabled: z.boolean().optional(),
  certificate_template_id: z.string().uuid().nullable().optional(),
  designation_id: z.string().uuid().nullable().optional(),
  sequential_locking_enabled: z.boolean().optional(),
  passing_score: z.number().int().min(0).max(100).optional(),
  require_knowledge_checks: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  published_at: z.string().datetime().nullable().optional(),
});

const coursePayloadSchema = z.object({
  mode: z.enum(["create", "edit"]).optional(),
  courseId: z.string().uuid().optional(),
}).and(courseUpsertSchema);

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user via Authorization header (Bearer token)
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    let raw: unknown;
    try {
      raw = JSON.parse(courseDataJson);
    } catch {
      return NextResponse.json(
        { error: "Invalid courseData JSON" },
        { status: 400 }
      );
    }
    const parsed = coursePayloadSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { mode, courseId: existingCourseId, ...coursePayload } = parsed.data;

    // Validate instructor_id refers to a real instructor profile. Without
    // this, a super_admin can assign a course to any uuid (including a
    // learner profile, which then grants that learner full course-access
    // via userHasCourseAccess `course.instructor_id === userId` shortcut).
    if (coursePayload.instructor_id) {
      const { data: instructorProfile } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", coursePayload.instructor_id)
        .maybeSingle();
      if (
        !instructorProfile ||
        !["instructor", "super_admin"].includes(instructorProfile.role)
      ) {
        return NextResponse.json(
          { error: "instructor_id must reference an active instructor profile" },
          { status: 400 }
        );
      }
    }

    let courseId: string;

    if (mode === "edit" && existingCourseId) {
      courseId = existingCourseId;
      const { error } = await supabaseAdmin
        .from("courses")
        .update(coursePayload)
        .eq("id", courseId);

      if (error) {
        console.error("admin course update failed", error);
        return NextResponse.json(
          { error: "Could not update course" },
          { status: 500 }
        );
      }
    } else {
      const { data: created, error } = await supabaseAdmin
        .from("courses")
        .insert(coursePayload)
        .select("id")
        .single();

      if (error) {
        console.error("admin course insert failed", error);
        return NextResponse.json(
          { error: "Could not create course" },
          { status: 500 }
        );
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

        // Cache-bust so a later edit that overwrites this same path
        // forces fresh fetches across the catalog / detail pages.
        const cacheBustedUrl = `${urlData.publicUrl}?v=${Date.now()}`;

        await supabaseAdmin
          .from("courses")
          .update({ thumbnail_url: cacheBustedUrl })
          .eq("id", courseId);
      }
    }

    // Bust the SSR catalog cache so the new/updated course appears on
    // /courses and /categories/[slug] within seconds rather than waiting
    // for the 60s revalidate window. The "courses" tag is shared by the
    // course-grid cache + the category-page caches (which mark themselves
    // with both "categories" and "courses" tags).
    revalidateTag("courses");

    return NextResponse.json({ data: { id: courseId } }, { status: 201 });
  } catch (err) {
    console.error("Admin course creation error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
