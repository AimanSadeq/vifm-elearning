"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

// Redirect to first lesson or last accessed lesson
export default function CourseLearnPage() {
  const params = useParams();
  const slug = params.slug as string;
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    async function redirect() {
      const supabase = createClient();

      // Get course
      const { data: course } = await supabase
        .from("courses")
        .select("id")
        .eq("slug", slug)
        .single();

      if (!course) {
        router.push(`/${locale}/courses/${slug}`);
        return;
      }

      // Check if user has a last accessed lesson
      if (user) {
        const { data: enrollment } = await supabase
          .from("enrollments")
          .select("last_lesson_id")
          .eq("user_id", user.id)
          .eq("course_id", course.id)
          .single();

        if (enrollment?.last_lesson_id) {
          router.push(
            `/${locale}/courses/${slug}/learn/${enrollment.last_lesson_id}`
          );
          return;
        }
      }

      // Get first lesson
      const { data: firstModule } = await supabase
        .from("modules")
        .select("id")
        .eq("course_id", course.id)
        .order("sort_order")
        .limit(1)
        .single();

      if (firstModule) {
        const { data: firstLesson } = await supabase
          .from("lessons")
          .select("id")
          .eq("module_id", firstModule.id)
          .order("sort_order")
          .limit(1)
          .single();

        if (firstLesson) {
          router.push(
            `/${locale}/courses/${slug}/learn/${firstLesson.id}`
          );
          return;
        }
      }

      // Fallback to course detail
      router.push(`/${locale}/courses/${slug}`);
    }

    if (slug) redirect();
  }, [slug, user, locale, router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}
