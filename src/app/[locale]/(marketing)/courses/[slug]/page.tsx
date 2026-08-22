import type { Metadata } from "next";
import { createServerSupabase } from "@/lib/supabase/server";
import CourseDetailClient from "./CourseDetailClient";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

/**
 * Server wrapper for the course detail page. Its sole job is to emit
 * per-course SEO metadata (title, description, canonical, hreflang, OG image)
 * via `generateMetadata` — without it, every course inherited the parent
 * `courses/layout.tsx` metadata ("All Courses", canonical `/courses`), so all
 * courses shared one title and canonicalised to the catalogue.
 *
 * The interactive UI still lives in the client component, which reads the slug
 * from the route and fetches its own data. This wrapper renders it unchanged.
 */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const isAr = locale === "ar";

  const supabase = await createServerSupabase();
  const { data: course } = await supabase
    .from("courses")
    .select(
      "title, title_ar, description, description_ar, short_description, short_description_ar, thumbnail_url",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  const canonical = `/${locale}/courses/${slug}`;
  const languages = {
    en: `/en/courses/${slug}`,
    ar: `/ar/courses/${slug}`,
  };

  // Unknown / unpublished slug: keep it out of the index rather than emit a
  // misleading catalogue title. The client component renders its own
  // "Course not found" state.
  if (!course) {
    return {
      title: isAr ? "الدورة غير موجودة" : "Course Not Found",
      robots: { index: false, follow: true },
      alternates: { canonical, languages },
    };
  }

  const title =
    (isAr ? course.title_ar : course.title) || course.title || "Course";
  const description =
    (isAr
      ? course.short_description_ar || course.description_ar
      : course.short_description || course.description) ||
    (isAr
      ? "دورة تدريبية احترافية من أكاديمية VIFM."
      : "A professional training course from VIFM Academy.");

  const image = course.thumbnail_url || undefined;

  return {
    title,
    description,
    alternates: { canonical, languages },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      locale: isAr ? "ar_AE" : "en_US",
      ...(image ? { images: [{ url: image }] } : {}),
    },
    ...(image
      ? { twitter: { card: "summary_large_image", title, description, images: [image] } }
      : {}),
  };
}

export default function CourseDetailPage() {
  return <CourseDetailClient />;
}
