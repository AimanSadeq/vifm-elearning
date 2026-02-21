"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import {
  BookOpen,
  Clock,
  Users,
  CheckCircle2,
  Circle,
  ArrowLeft,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import type { DifficultyLevel } from "@/types";

interface PathDetail {
  id: string;
  title: string;
  title_ar?: string | null;
  description?: string | null;
  description_ar?: string | null;
  slug: string;
  thumbnail_url?: string | null;
  difficulty_level?: DifficultyLevel | null;
  estimated_hours: number;
  enrollment_count: number;
}

interface PathCourseItem {
  id: string;
  sort_order: number;
  is_required: boolean;
  course: {
    id: string;
    title: string;
    title_ar?: string | null;
    slug: string;
    thumbnail_url?: string | null;
    duration_hours?: number | null;
  };
}

interface PathEnrollment {
  id: string;
  status: string;
  progress: number;
}

export default function LearningPathDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const locale = useLocale();
  const t = useTranslations("learningPaths");
  const { user } = useAuth();

  const [path, setPath] = useState<PathDetail | null>(null);
  const [courses, setCourses] = useState<PathCourseItem[]>([]);
  const [enrollment, setEnrollment] = useState<PathEnrollment | null>(null);
  const [completedCourseIds, setCompletedCourseIds] = useState<Set<string>>(
    new Set()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);

  useEffect(() => {
    async function fetchPath() {
      const supabase = createClient();

      // Fetch path details
      const { data: pathData } = await supabase
        .from("learning_paths")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();

      if (!pathData) {
        setIsLoading(false);
        return;
      }

      setPath(pathData as PathDetail);

      // Fetch courses
      const { data: coursesData } = await supabase
        .from("learning_path_courses")
        .select(
          `
          id, sort_order, is_required,
          course:courses!learning_path_courses_course_id_fkey(
            id, title, title_ar, slug, thumbnail_url, duration_hours
          )
        `
        )
        .eq("learning_path_id", pathData.id)
        .order("sort_order");

      setCourses((coursesData as unknown as PathCourseItem[]) ?? []);

      // If user is logged in, check enrollment + course completions
      if (user) {
        const { data: enrollmentData } = await supabase
          .from("learning_path_enrollments")
          .select("id, status, progress")
          .eq("learning_path_id", pathData.id)
          .eq("user_id", user.id)
          .single();

        if (enrollmentData) {
          setEnrollment(enrollmentData as PathEnrollment);
        }

        // Check which courses the user has completed
        if (coursesData && coursesData.length > 0) {
          const courseIds = coursesData.map(
            (c: Record<string, unknown>) =>
              ((c.course as Record<string, unknown>)?.id as string) ?? ""
          ).filter(Boolean);

          if (courseIds.length > 0) {
            const { data: userEnrollments } = await supabase
              .from("enrollments")
              .select("course_id, status")
              .eq("user_id", user.id)
              .in("course_id", courseIds);

            const completed = new Set<string>();
            (userEnrollments ?? []).forEach((e: Record<string, unknown>) => {
              if (e.status === "completed") {
                completed.add(e.course_id as string);
              }
            });
            setCompletedCourseIds(completed);
          }
        }
      }

      setIsLoading(false);
    }

    fetchPath();
  }, [slug, user]);

  async function handleEnroll() {
    if (!user || !path) return;
    setIsEnrolling(true);

    try {
      const res = await fetch(`/api/learning-paths/${path.id}/enroll`, {
        method: "POST",
      });
      const json = await res.json();

      if (res.ok) {
        setEnrollment({
          id: json.data.id,
          status: json.data.status ?? "active",
          progress: json.data.progress ?? 0,
        });
      }
    } catch {
      // Silently fail — user can retry
    }

    setIsEnrolling(false);
  }

  function getDifficultyBadge(level?: DifficultyLevel | null) {
    switch (level) {
      case "beginner":
        return <Badge variant="success">{t("beginner")}</Badge>;
      case "intermediate":
        return <Badge variant="info">{t("intermediate")}</Badge>;
      case "advanced":
        return <Badge variant="warning">{t("advanced")}</Badge>;
      case "expert":
        return <Badge variant="destructive">{t("expert")}</Badge>;
      default:
        return null;
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!path) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="font-heading text-2xl font-bold">
          {t("pathNotFound")}
        </h1>
        <Link href={`/${locale}/learning-paths`}>
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 me-2" />
            {t("backToPaths")}
          </Button>
        </Link>
      </div>
    );
  }

  const title =
    locale === "ar" && path.title_ar ? path.title_ar : path.title;
  const desc =
    locale === "ar" && path.description_ar
      ? path.description_ar
      : path.description;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back link */}
      <Link
        href={`/${locale}/learning-paths`}
        className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 me-1" />
        {t("backToPaths")}
      </Link>

      {/* Header */}
      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        <div className="lg:col-span-2 space-y-4">
          <h1 className="font-heading text-3xl font-bold">{title}</h1>
          {desc && <p className="text-muted-foreground">{desc}</p>}

          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {getDifficultyBadge(path.difficulty_level)}
            <span className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              {courses.length} {t("courses")}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {path.estimated_hours}h
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {path.enrollment_count} {t("enrolled")}
            </span>
          </div>

          {/* Enrollment + Progress */}
          {enrollment ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{t("progress")}</span>
                <span className="text-muted-foreground">
                  {Math.round(enrollment.progress)}%
                </span>
              </div>
              <Progress value={enrollment.progress} className="h-3" />
              {enrollment.status === "completed" && (
                <Badge variant="success" className="mt-1">
                  {t("completed")}
                </Badge>
              )}
            </div>
          ) : user ? (
            <Button
              onClick={handleEnroll}
              disabled={isEnrolling}
              size="lg"
            >
              {isEnrolling ? t("enrolling") : t("enrollNow")}
            </Button>
          ) : (
            <Link href={`/${locale}/auth/login`}>
              <Button size="lg">{t("loginToEnroll")}</Button>
            </Link>
          )}
        </div>

        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden rounded-lg bg-muted lg:aspect-square">
          {path.thumbnail_url ? (
            <Image
              src={path.thumbnail_url}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-brand-50">
              <BookOpen className="h-16 w-16 text-brand-300" />
            </div>
          )}
        </div>
      </div>

      {/* Course List */}
      <div className="space-y-4">
        <h2 className="font-heading text-xl font-bold">{t("courseList")}</h2>

        {courses.map((item, index) => {
          const courseTitle =
            locale === "ar" && item.course.title_ar
              ? item.course.title_ar
              : item.course.title;
          const isCompleted = completedCourseIds.has(item.course.id);

          return (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
                  {index + 1}
                </div>

                {item.course.thumbnail_url && (
                  <div className="relative hidden h-16 w-24 shrink-0 overflow-hidden rounded bg-muted sm:block">
                    <Image
                      src={item.course.thumbnail_url}
                      alt={courseTitle}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{courseTitle}</h3>
                    {!item.is_required && (
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        {t("optional")}
                      </Badge>
                    )}
                  </div>
                  {item.course.duration_hours && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.course.duration_hours}h
                    </p>
                  )}
                </div>

                <div className="shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  ) : (
                    <Circle className="h-6 w-6 text-muted-foreground/30" />
                  )}
                </div>

                {enrollment && (
                  <Link
                    href={`/${locale}/courses/${item.course.slug}`}
                    className="shrink-0"
                  >
                    <Button variant="outline" size="sm">
                      {isCompleted ? t("review") : t("start")}
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
