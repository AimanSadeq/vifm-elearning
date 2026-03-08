import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { courseContentRegistry } from "@/data/course-content";

/**
 * POST /api/admin/courses/[id]/scaffold
 *
 * Auto-creates modules and lessons from the static courseContentRegistry
 * for a given course. This is idempotent — if modules already exist, it
 * returns early without duplicating.
 *
 * Body: { slug: string } — the designation slug to look up in the registry
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params;

    // 1. Auth check
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

    // 2. Role check
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["super_admin", "instructor"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. Parse request body
    const body = await request.json();
    const { slug } = body as { slug?: string };

    if (!slug) {
      return NextResponse.json(
        { error: "slug is required" },
        { status: 400 }
      );
    }

    // 4. Look up registry data
    const registryData = courseContentRegistry[slug];
    if (!registryData) {
      const availableSlugs = Object.keys(courseContentRegistry).join(", ");
      return NextResponse.json(
        {
          error: `No course content registry found for "${slug}". This certification does not have a course content template defined yet. Available templates: ${availableSlugs}`,
        },
        { status: 404 }
      );
    }

    // 5. Idempotency — check if modules already exist for this course
    const { data: existingModules } = await supabaseAdmin
      .from("modules")
      .select("id")
      .eq("course_id", courseId)
      .limit(1);

    if (existingModules && existingModules.length > 0) {
      return NextResponse.json({
        message: "Course already has modules — scaffold skipped",
        skipped: true,
      });
    }

    // 6. Create modules and lessons
    let totalModules = 0;
    let totalLessons = 0;

    for (const mod of registryData.modules) {
      // Insert module
      const { data: newModule, error: modError } = await supabaseAdmin
        .from("modules")
        .insert({
          course_id: courseId,
          title: mod.title.en,
          title_ar: mod.title.ar,
          sort_order: mod.id - 1, // 0-indexed
        })
        .select("id")
        .single();

      if (modError || !newModule) {
        console.error(`[scaffold] Module insert error:`, modError);
        continue;
      }

      totalModules++;

      // Insert lessons for each video in this module
      const lessonInserts = mod.videos.map((video, videoIndex) => {
        // Parse duration string like "25 min" or "30 min"
        const durationMatch = video.duration.match(/(\d+)/);
        const durationMinutes = durationMatch ? parseInt(durationMatch[1], 10) : 0;

        return {
          module_id: newModule.id,
          course_id: courseId,
          title: video.title.en,
          title_ar: video.title.ar,
          description: video.desc.en || null,
          description_ar: video.desc.ar || null,
          content_type: "video" as const,
          sort_order: videoIndex,
          duration_minutes: durationMinutes,
          is_preview: false,
          is_mandatory: true,
          video_url: null,
        };
      });

      if (lessonInserts.length > 0) {
        const { error: lessonsError } = await supabaseAdmin
          .from("lessons")
          .insert(lessonInserts);

        if (lessonsError) {
          console.error(`[scaffold] Lessons insert error:`, lessonsError);
        } else {
          totalLessons += lessonInserts.length;
        }
      }
    }

    return NextResponse.json({
      message: "Scaffold complete",
      skipped: false,
      modulesCreated: totalModules,
      lessonsCreated: totalLessons,
    });
  } catch (error) {
    console.error("[scaffold] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
