"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { BookOpen, PlayCircle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";

interface EnrolledCourse {
  id: string;
  status: string;
  progress_percentage: number;
  enrolled_at: string;
  course: {
    id: string;
    title: string;
    title_ar?: string;
    slug: string;
    thumbnail_url?: string;
    duration_hours?: number;
    category: { name: string; name_ar: string } | null;
  };
}

export default function MyCoursesPage() {
  const t = useTranslations("dashboard");
  const tc = useTranslations("courses");
  const locale = useLocale();
  const { user, isLoading: authLoading } = useAuth();

  const [enrollments, setEnrollments] = useState<EnrolledCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  useEffect(() => {
    async function fetchEnrollments() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      const supabase = createClient();
      const { data } = await supabase
        .from("enrollments")
        .select(
          `
          id,
          status,
          progress_percentage,
          enrolled_at,
          course:courses!enrollments_course_id_fkey(
            id, title, title_ar, slug, thumbnail_url, duration_hours,
            category:categories(name, name_ar)
          )
        `
        )
        .eq("user_id", user.id)
        .order("enrolled_at", { ascending: false });

      setEnrollments((data as unknown as EnrolledCourse[]) ?? []);
      setIsLoading(false);
    }

    if (!authLoading) fetchEnrollments();
  }, [user, authLoading]);

  const filteredEnrollments = enrollments.filter((e) => {
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
        <h1 className="font-heading text-2xl font-bold">{t("myCourses")}</h1>
        <div className="flex items-center gap-2">
          {(["all", "active", "completed"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === "all"
                ? "All"
                : f === "active"
                  ? tc("inProgress")
                  : tc("completed")}
            </Button>
          ))}
        </div>
      </div>

      {filteredEnrollments.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={t("noCourses")}
          action={
            <Link href={`/${locale}/courses`}>
              <Button>{t("browseCourses")}</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEnrollments.map((enrollment) => {
            const course = enrollment.course;
            const title =
              locale === "ar" && course.title_ar
                ? course.title_ar
                : course.title;
            const catName =
              locale === "ar"
                ? course.category?.name_ar
                : course.category?.name;
            const isCompleted = enrollment.status === "completed";

            return (
              <Link
                key={enrollment.id}
                href={`/${locale}/courses/${course.slug}/learn`}
              >
                <Card className="group overflow-hidden transition-all hover:shadow-card-hover">
                  {/* Thumbnail */}
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    {course.thumbnail_url ? (
                      <Image
                        src={course.thumbnail_url}
                        alt={title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-brand-50">
                        <BookOpen className="h-10 w-10 text-brand-300" />
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4">
                    {catName && (
                      <p className="text-xs text-muted-foreground mb-1">
                        {catName}
                      </p>
                    )}
                    <h3 className="font-medium line-clamp-2 group-hover:text-brand-600 transition-colors">
                      {title}
                    </h3>

                    <div className="mt-3">
                      {isCompleted ? (
                        <div className="flex items-center gap-1.5 text-sm font-medium text-success">
                          <CheckCircle2 className="h-4 w-4" />
                          {tc("completed")}
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">
                              {tc("overview") === "Overview"
                                ? "Progress"
                                : "التقدم"}
                            </span>
                            <span className="font-medium">
                              {Math.round(enrollment.progress_percentage)}%
                            </span>
                          </div>
                          <Progress
                            value={enrollment.progress_percentage}
                            className="h-2"
                          />
                        </>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3 w-full gap-1"
                    >
                      <PlayCircle className="h-4 w-4" />
                      {isCompleted
                        ? tc("reviews") === "Reviews"
                          ? "Review"
                          : "مراجعة"
                        : tc("continueLearning")}
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
