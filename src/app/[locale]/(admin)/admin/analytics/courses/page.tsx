"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  Star,
  Users,
  Download,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { StatCard } from "@/components/analytics/StatCard";
import { TopCoursesBarChart } from "@/components/analytics/charts/TopCoursesBarChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { exportToCSV } from "@/lib/utils/csv-export";

interface CourseRow {
  id: string;
  title: string;
  enrollment_count: number;
  average_rating: number;
  status: string;
  level: string;
  lessons_count: number;
}

export default function CoursesAnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [totalCourses, setTotalCourses] = useState(0);
  const [publishedCourses, setPublishedCourses] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [courses, setCourses] = useState<CourseRow[]>([]);

  useEffect(() => {
    async function fetchCourses() {
      const supabase = createClient();

      const [{ count: total }, { count: published }, { data: coursesData }] =
        await Promise.all([
          supabase
            .from("courses")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("courses")
            .select("*", { count: "exact", head: true })
            .eq("status", "published"),
          supabase
            .from("courses")
            .select(
              "id, title, enrollment_count, average_rating, status, level, lessons_count"
            )
            .order("enrollment_count", { ascending: false }),
        ]);

      setTotalCourses(total ?? 0);
      setPublishedCourses(published ?? 0);

      const mapped = (coursesData ?? []).map((c: Record<string, unknown>) => ({
        id: c.id as string,
        title: (c.title as string) || "",
        enrollment_count: (c.enrollment_count as number) || 0,
        average_rating: (c.average_rating as number) || 0,
        status: (c.status as string) || "draft",
        level: (c.level as string) || "beginner",
        lessons_count: (c.lessons_count as number) || 0,
      }));

      setCourses(mapped);

      const rated = mapped.filter((c) => c.average_rating > 0);
      setAvgRating(
        rated.length > 0
          ? rated.reduce((sum, c) => sum + c.average_rating, 0) / rated.length
          : 0
      );

      setIsLoading(false);
    }

    fetchCourses();
  }, []);

  const courseColumns: Column<CourseRow>[] = [
    {
      key: "title",
      header: "Course",
      render: (item) => (
        <div>
          <p className="font-medium">{item.title}</p>
          <p className="text-xs capitalize text-muted-foreground">
            {item.level}
          </p>
        </div>
      ),
    },
    {
      key: "enrollments",
      header: "Enrollments",
      render: (item) => (
        <span className="font-medium">{item.enrollment_count}</span>
      ),
    },
    {
      key: "rating",
      header: "Rating",
      render: (item) => (
        <span>
          {item.average_rating > 0
            ? `${item.average_rating.toFixed(1)} ★`
            : "—"}
        </span>
      ),
    },
    {
      key: "lessons",
      header: "Lessons",
      render: (item) => <span>{item.lessons_count}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (item) => (
        <Badge
          variant={
            item.status === "published"
              ? "success"
              : item.status === "draft"
                ? "secondary"
                : "warning"
          }
        >
          {item.status}
        </Badge>
      ),
    },
  ];

  const chartData = courses.slice(0, 10).map((c) => ({
    title: c.title.length > 20 ? c.title.substring(0, 20) + "…" : c.title,
    enrollments: c.enrollment_count,
    revenue: 0,
  }));

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Course Analytics</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            exportToCSV(courses, "courses-data", [
              { key: "title", header: "Course" },
              { key: "enrollment_count", header: "Enrollments" },
              { key: "average_rating", header: "Rating" },
              { key: "lessons_count", header: "Lessons" },
              { key: "level", header: "Level" },
              { key: "status", header: "Status" },
            ])
          }
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={BookOpen}
          label="Total Courses"
          value={totalCourses.toLocaleString()}
          color="text-brand-600"
          bg="bg-brand-50"
        />
        <StatCard
          icon={Users}
          label="Published"
          value={publishedCourses.toLocaleString()}
          color="text-success"
          bg="bg-success/10"
        />
        <StatCard
          icon={Star}
          label="Avg. Rating"
          value={avgRating > 0 ? `${avgRating.toFixed(1)} ★` : "—"}
          color="text-warning"
          bg="bg-warning/10"
        />
      </div>

      {/* Top Courses Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Courses by Enrollment</CardTitle>
        </CardHeader>
        <CardContent>
          <TopCoursesBarChart data={chartData} />
        </CardContent>
      </Card>

      {/* All Courses Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={courseColumns}
            data={courses}
            rowKey={(item) => item.id}
            emptyMessage="No courses yet"
          />
        </CardContent>
      </Card>
    </div>
  );
}
