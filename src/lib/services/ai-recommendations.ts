// Rule-based recommendation service
// Recommends popular courses the user hasn't enrolled in

import { createClient } from "@/lib/supabase/client";

interface Recommendation {
  courseId: string;
  title: string;
  titleAr?: string | null;
  slug: string;
  thumbnailUrl?: string | null;
  price: number;
  currency: string;
  isFree: boolean;
  averageRating: number;
  enrollmentCount: number;
  reason: string;
  score: number;
}

export async function getRecommendations(
  userId: string,
  limit: number = 4
): Promise<Recommendation[]> {
  const supabase = createClient();

  // Get user's enrolled course IDs
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("course_id")
    .eq("user_id", userId);

  const enrolledCourseIds = (enrollments ?? []).map((e) => e.course_id);

  // Get popular published courses the user hasn't enrolled in
  const query = supabase
    .from("courses")
    .select("id, title, title_ar, slug, thumbnail_url, price, currency, is_free, average_rating, enrollment_count, category_id")
    .eq("status", "published")
    .order("enrollment_count", { ascending: false })
    .limit(limit + enrolledCourseIds.length);

  const { data: courses } = await query;

  if (!courses) return [];

  const recommendations: Recommendation[] = courses
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
      reason: c.enrollment_count > 10
        ? "Popular among learners"
        : c.average_rating >= 4
          ? "Highly rated"
          : "Recommended for you",
      score: 1 - i * 0.1,
    }));

  return recommendations;
}
