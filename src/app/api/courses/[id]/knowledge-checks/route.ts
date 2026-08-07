import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { userHasCourseAccess } from "@/lib/services/access";
import { getCourseKnowledgeCheckSummary } from "@/lib/services/knowledge-check-service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Consolidated knowledge-check results for the signed-in learner on one
 * course. Powers the end-of-course results screen and the "certificate
 * blocked" messaging. Accepts a course id or slug so client pages that only
 * know the slug don't need an extra lookup.
 */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const query = supabaseAdmin
    .from("courses")
    .select("id, title, title_ar, slug, certificate_enabled");
  const { data: course } = await (UUID_RE.test(id)
    ? query.eq("id", id)
    : query.eq("slug", id)
  ).maybeSingle();

  if (!course)
    return NextResponse.json({ error: "Course not found" }, { status: 404 });

  const allowed = await userHasCourseAccess(user.id, course.id, {
    authMetadata: user.app_metadata as { role?: string } | null,
  });
  if (!allowed)
    return NextResponse.json(
      { error: "You don't have access to this course" },
      { status: 403 }
    );

  const summary = await getCourseKnowledgeCheckSummary(user.id, course.id);

  const { data: certificate } = await supabaseAdmin
    .from("certificates")
    .select("id, certificate_number, pdf_url")
    .eq("user_id", user.id)
    .eq("course_id", course.id)
    .maybeSingle();

  return NextResponse.json({
    data: {
      course: {
        id: course.id,
        title: course.title,
        titleAr: course.title_ar,
        slug: course.slug,
        certificateEnabled: Boolean(course.certificate_enabled),
      },
      summary,
      certificate: certificate ?? null,
    },
  });
}
