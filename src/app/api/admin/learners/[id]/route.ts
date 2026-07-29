import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

// GET /api/admin/learners/[id] — a learner's enrolled courses (with progress)
// and certificates, for the admin per-learner detail view.
import { getOwnRole } from "@/lib/supabase/own-profile";
import { supabaseAdmin } from "@/lib/supabase/admin";
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Own role — read via my_profile; `profiles.role` is not granted
  // to `authenticated` any more.
  const me = { role: await getOwnRole(supabase) }
  if (me?.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  type CourseRef = { title: string | null; slug?: string | null } | null;
  const pickCourse = (c: unknown): CourseRef => {
    const v = c as CourseRef | CourseRef[] | null;
    return Array.isArray(v) ? (v[0] ?? null) : v;
  };

  const [{ data: profile }, { data: enrollments }, { data: certificates }] =
    await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("full_name, email")
        .eq("id", id)
        .maybeSingle(),
      supabaseAdmin
        .from("enrollments")
        .select(
          "id, status, progress_percentage, enrolled_at, completed_at, course:courses!enrollments_course_id_fkey(title, slug)",
        )
        .eq("user_id", id)
        .order("enrolled_at", { ascending: false }),
      supabaseAdmin
        .from("certificates")
        .select(
          "id, certificate_number, status, issued_at, course:courses(title)",
        )
        .eq("user_id", id)
        .order("issued_at", { ascending: false }),
    ]);

  return NextResponse.json({
    data: {
      profile: profile ?? null,
      enrollments: (enrollments ?? []).map((e) => ({
        id: e.id,
        status: e.status,
        progress: Math.round(Number(e.progress_percentage) || 0),
        enrolledAt: e.enrolled_at,
        completedAt: e.completed_at,
        courseTitle: pickCourse(e.course)?.title ?? "—",
      })),
      certificates: (certificates ?? []).map((c) => ({
        id: c.id,
        certificateNumber: c.certificate_number,
        status: c.status,
        issuedAt: c.issued_at,
        courseTitle: pickCourse(c.course)?.title ?? "—",
      })),
    },
  });
}
