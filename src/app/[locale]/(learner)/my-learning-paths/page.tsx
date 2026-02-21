"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import {
  CheckCircle2,
  Circle,
  PlayCircle,
  Route,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import type { LearningPathStatus } from "@/types";

interface PathEnrollmentItem {
  id: string;
  status: LearningPathStatus;
  progress: number;
  enrolled_at: string;
  completed_at?: string | null;
  learning_path: {
    id: string;
    title: string;
    title_ar?: string | null;
    slug: string;
    thumbnail_url?: string | null;
    estimated_hours: number;
  };
}

interface PathCourseStatus {
  course_id: string;
  course_title: string;
  course_title_ar?: string | null;
  course_slug: string;
  is_required: boolean;
  sort_order: number;
  enrollment_status?: string;
}

export default function LearnerLearningPathsPage() {
  const locale = useLocale();
  const t = useTranslations("learningPaths");
  const { user, isLoading: authLoading } = useAuth();

  const [enrollments, setEnrollments] = useState<PathEnrollmentItem[]>([]);
  const [coursesMap, setCoursesMap] = useState<
    Map<string, PathCourseStatus[]>
  >(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      const supabase = createClient();

      // Fetch enrolled learning paths
      const { data: enrollmentData } = await supabase
        .from("learning_path_enrollments")
        .select(
          `
          id, status, progress, enrolled_at, completed_at,
          learning_path:learning_paths!learning_path_enrollments_learning_path_id_fkey(
            id, title, title_ar, slug, thumbnail_url, estimated_hours
          )
        `
        )
        .eq("user_id", user.id)
        .order("enrolled_at", { ascending: false });

      const enrollments =
        (enrollmentData as unknown as PathEnrollmentItem[]) ?? [];
      setEnrollments(enrollments);

      // For each enrolled path, fetch courses and their completion status
      const pathIds = enrollments.map((e) => e.learning_path.id);
      if (pathIds.length > 0) {
        const { data: pathCourses } = await supabase
          .from("learning_path_courses")
          .select(
            `
            learning_path_id, course_id, sort_order, is_required,
            course:courses!learning_path_courses_course_id_fkey(
              title, title_ar, slug
            )
          `
          )
          .in("learning_path_id", pathIds)
          .order("sort_order");

        // Get user's course enrollment statuses
        const courseIds = (pathCourses ?? []).map(
          (c: Record<string, unknown>) => c.course_id as string
        );
        const uniqueCourseIds = [...new Set(courseIds)];

        let userCourseEnrollments: Record<string, unknown>[] = [];
        if (uniqueCourseIds.length > 0) {
          const { data: uce } = await supabase
            .from("enrollments")
            .select("course_id, status")
            .eq("user_id", user.id)
            .in("course_id", uniqueCourseIds);
          userCourseEnrollments = uce ?? [];
        }

        const courseStatusMap = new Map<string, string>();
        userCourseEnrollments.forEach((e) => {
          courseStatusMap.set(e.course_id as string, e.status as string);
        });

        // Group courses by learning path
        const map = new Map<string, PathCourseStatus[]>();
        (pathCourses ?? []).forEach((pc: Record<string, unknown>) => {
          const pathId = pc.learning_path_id as string;
          const course = pc.course as Record<string, unknown>;
          const entry: PathCourseStatus = {
            course_id: pc.course_id as string,
            course_title: course?.title as string,
            course_title_ar: course?.title_ar as string | undefined,
            course_slug: course?.slug as string,
            is_required: pc.is_required as boolean,
            sort_order: pc.sort_order as number,
            enrollment_status: courseStatusMap.get(pc.course_id as string),
          };

          const existing = map.get(pathId) ?? [];
          existing.push(entry);
          map.set(pathId, existing);
        });

        setCoursesMap(map);
      }

      setIsLoading(false);
    }

    if (!authLoading) fetchData();
  }, [user, authLoading]);

  const filtered = enrollments.filter((e) => {
    if (filter === "all") return true;
    if (filter === "active") return e.status === "active";
    if (filter === "completed") return e.status === "completed";
    return true;
  });

  if (isLoading || authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">{t("myPaths")}</h1>
        <div className="flex items-center gap-2">
          {(["all", "active", "completed"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === "all"
                ? t("all")
                : f === "active"
                  ? t("inProgress")
                  : t("completed")}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Route}
          title={t("noPaths")}
          description={t("noPathsDescription")}
          action={
            <Link href={`/${locale}/learning-paths`}>
              <Button>{t("browsePaths")}</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          {filtered.map((enrollment) => {
            const lp = enrollment.learning_path;
            const title =
              locale === "ar" && lp.title_ar ? lp.title_ar : lp.title;
            const pathCourses = coursesMap.get(lp.id) ?? [];
            const isCompleted = enrollment.status === "completed";

            return (
              <Card key={enrollment.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {lp.thumbnail_url && (
                        <div className="relative hidden h-12 w-20 shrink-0 overflow-hidden rounded bg-muted sm:block">
                          <Image
                            src={lp.thumbnail_url}
                            alt={title}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        </div>
                      )}
                      <div>
                        <Link
                          href={`/${locale}/learning-paths/${lp.slug}`}
                          className="font-semibold hover:text-brand-600 transition-colors"
                        >
                          {title}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {lp.estimated_hours}h &middot;{" "}
                          {pathCourses.length} {t("courses")}
                        </p>
                      </div>
                    </div>
                    {isCompleted ? (
                      <Badge variant="success">{t("completed")}</Badge>
                    ) : (
                      <Badge variant="info">{t("inProgress")}</Badge>
                    )}
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">
                        {t("progress")}
                      </span>
                      <span className="font-medium">
                        {Math.round(enrollment.progress)}%
                      </span>
                    </div>
                    <Progress value={enrollment.progress} className="h-2" />
                  </div>
                </CardHeader>

                <CardContent className="pt-2">
                  <div className="space-y-1">
                    {pathCourses.map((course, idx) => {
                      const cTitle =
                        locale === "ar" && course.course_title_ar
                          ? course.course_title_ar
                          : course.course_title;
                      const courseCompleted =
                        course.enrollment_status === "completed";
                      const courseActive =
                        course.enrollment_status === "active";

                      return (
                        <div
                          key={course.course_id}
                          className="flex items-center gap-2 py-1.5 text-sm"
                        >
                          {courseCompleted ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                          ) : courseActive ? (
                            <PlayCircle className="h-4 w-4 shrink-0 text-blue-500" />
                          ) : (
                            <Circle className="h-4 w-4 shrink-0 text-muted-foreground/30" />
                          )}

                          <span className="text-muted-foreground w-5 shrink-0 text-xs">
                            {idx + 1}.
                          </span>

                          <Link
                            href={`/${locale}/courses/${course.course_slug}`}
                            className="truncate hover:text-brand-600 transition-colors"
                          >
                            {cTitle}
                          </Link>

                          {!course.is_required && (
                            <Badge
                              variant="secondary"
                              className="shrink-0 text-[10px] px-1"
                            >
                              {t("optional")}
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
