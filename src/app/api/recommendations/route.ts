import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "4");

  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user's enrolled course IDs
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("course_id")
    .eq("user_id", user.id);

  const enrolledCourseIds = (enrollments ?? []).map((e) => e.course_id);

  // Get popular published courses the user hasn't enrolled in
  const { data: courses } = await supabase
    .from("courses")
    .select(
      "id, title, title_ar, slug, thumbnail_url, price, currency, is_free, average_rating, enrollment_count"
    )
    .eq("status", "published")
    .order("enrollment_count", { ascending: false })
    .limit(limit + enrolledCourseIds.length);

  if (!courses) {
    return NextResponse.json({ data: [] });
  }

  const recommendations = courses
    .filter((c) => !enrolledCourseIds.includes(c.id))
    .slice(0, limit)
    .map((c, i) => ({
      courseId: c.id,
      title: c.title,
      titleAr: c.title_ar,
      slug: c.slug,
      thumbnailUrl: c.thumbnail_url,
      price: c.price,
      currency: c.currency,
      isFree: c.is_free,
      averageRating: c.average_rating,
      enrollmentCount: c.enrollment_count,
      reason:
        c.enrollment_count > 10
          ? "Popular among learners"
          : c.average_rating >= 4
            ? "Highly rated"
            : "Recommended for you",
      score: 1 - i * 0.1,
    }));

  return NextResponse.json({ data: recommendations });
}
