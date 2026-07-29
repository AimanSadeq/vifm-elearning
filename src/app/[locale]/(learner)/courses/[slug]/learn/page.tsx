"use client";

import { useEffect, useRef } from "react";
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
  const { user, isLoading } = useAuth();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (isLoading || hasRedirected.current) return;

    async function redirect() {
      const supabase = createClient();

      // Get course
      const { data: course } = await supabase
        .from("courses")
        .select("id")
        .eq("slug", slug)
        .single();

      if (!course) {
        hasRedirected.current = true;
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
          hasRedirected.current = true;
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
        // lessons is no longer directly readable by `authenticated`;
        // lesson_access is the granted view over it.
        const { data: firstLesson } = await supabase
          .from("lesson_access")
          .select("id")
          .eq("module_id", firstModule.id)
          .order("sort_order")
          .limit(1)
          .single();

        if (firstLesson) {
          hasRedirected.current = true;
          router.push(
            `/${locale}/courses/${slug}/learn/${firstLesson.id}`
          );
          return;
        }
      }

      // Fallback to course detail
      hasRedirected.current = true;
      router.push(`/${locale}/courses/${slug}`);
    }

    redirect();
  }, [slug, user, isLoading, locale, router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}
