"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { BarChart3 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EnrollmentBarChart } from "@/components/analytics/charts/EnrollmentBarChart";
import { TopCoursesBarChart } from "@/components/analytics/charts/TopCoursesBarChart";

interface CourseOption {
  id: string;
  title: string;
}

interface EnrollmentTrend {
  month: string;
  enrollments: number;
  completions: number;
}

interface CoursePerformance {
  title: string;
  enrollments: number;
  revenue: number;
}

export default function InstructorAnalyticsPage() {
  const t = useTranslations("instructor");
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();

  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(
    searchParams.get("course")
  );
  const [enrollmentTrends, setEnrollmentTrends] = useState<EnrollmentTrend[]>(
    []
  );
  const [coursePerformance, setCoursePerformance] = useState<
    CoursePerformance[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      const supabase = createClient();

      // Fetch instructor's courses
      const { data: coursesData } = await supabase
        .from("courses")
        .select("id, title, enrollment_count, price")
        .eq("instructor_id", user.id)
        .order("enrollment_count", { ascending: false });

      const courseList = (coursesData ?? []) as Array<{
        id: string;
        title: string;
        enrollment_count: number;
        price: number;
      }>;

      setCourses(courseList.map((c) => ({ id: c.id, title: c.title })));

      // Course performance data
      setCoursePerformance(
        courseList.map((c) => ({
          title: c.title.length > 25 ? c.title.slice(0, 25) + "…" : c.title,
          enrollments: c.enrollment_count || 0,
          revenue: (c.enrollment_count || 0) * (c.price || 0),
        }))
      );

      // Fetch enrollment trends for instructor's courses
      const courseIds = courseList.map((c) => c.id);
      if (courseIds.length > 0) {
        const filterIds = selectedCourseId
          ? [selectedCourseId]
          : courseIds;

        const { data: enrollments } = await supabase
          .from("enrollments")
          .select("enrolled_at, status")
          .in("course_id", filterIds)
          .order("enrolled_at", { ascending: true });

        // Group by month
        const monthMap = new Map<
          string,
          { enrollments: number; completions: number }
        >();

        (enrollments ?? []).forEach((e: Record<string, unknown>) => {
          const date = new Date(e.enrolled_at as string);
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          const existing = monthMap.get(key) || {
            enrollments: 0,
            completions: 0,
          };
          existing.enrollments += 1;
          if (e.status === "completed") existing.completions += 1;
          monthMap.set(key, existing);
        });

        const trends: EnrollmentTrend[] = Array.from(monthMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-12)
          .map(([month, data]) => ({
            month,
            enrollments: data.enrollments,
            completions: data.completions,
          }));

        setEnrollmentTrends(trends);
      }

      setIsLoading(false);
    }

    if (!authLoading) fetchData();
  }, [user, authLoading, selectedCourseId]);

  if (isLoading || authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">{t("analytics")}</h1>

      {/* Course Filter */}
      {courses.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={selectedCourseId === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCourseId(null)}
          >
            All Courses
          </Button>
          {courses.map((course) => (
            <Button
              key={course.id}
              variant={selectedCourseId === course.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCourseId(course.id)}
            >
              {course.title}
            </Button>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Enrollment Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {t("enrollmentTrends")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EnrollmentBarChart data={enrollmentTrends} />
          </CardContent>
        </Card>

        {/* Course Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("coursePerformance")}</CardTitle>
          </CardHeader>
          <CardContent>
            <TopCoursesBarChart data={coursePerformance} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
