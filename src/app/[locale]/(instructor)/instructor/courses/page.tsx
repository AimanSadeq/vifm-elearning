"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { BookOpen, BarChart3 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

interface InstructorCourse {
  id: string;
  title: string;
  title_ar?: string | null;
  slug: string;
  status: string;
  enrollment_count: number;
  average_rating: number;
  completion_rate: number;
}

export default function InstructorCoursesPage() {
  const t = useTranslations("instructor");
  const locale = useLocale();
  const { user, isLoading: authLoading } = useAuth();

  const [courses, setCourses] = useState<InstructorCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCourses() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      const supabase = createClient();
      const { data } = await supabase
        .from("courses")
        .select(
          "id, title, title_ar, slug, status, enrollment_count, average_rating, completion_rate"
        )
        .eq("instructor_id", user.id)
        .order("created_at", { ascending: false });

      setCourses((data as InstructorCourse[]) ?? []);
      setIsLoading(false);
    }

    if (!authLoading) fetchCourses();
  }, [user, authLoading]);

  const columns: Column<InstructorCourse>[] = [
    {
      key: "title",
      header: t("courseTitle"),
      render: (item) => {
        const title =
          locale === "ar" && item.title_ar ? item.title_ar : item.title;
        return <span className="font-medium">{title}</span>;
      },
    },
    {
      key: "status",
      header: t("status"),
      render: (item) => (
        <Badge
          variant={
            item.status === "published"
              ? "success"
              : item.status === "draft"
                ? "secondary"
                : "outline"
          }
        >
          {item.status}
        </Badge>
      ),
    },
    {
      key: "students",
      header: t("students"),
      render: (item) => <span>{item.enrollment_count}</span>,
    },
    {
      key: "rating",
      header: t("rating"),
      render: (item) => (
        <span>
          {item.average_rating > 0
            ? `${item.average_rating.toFixed(1)} ★`
            : "—"}
        </span>
      ),
    },
    {
      key: "completion",
      header: t("completionRate"),
      render: (item) => <span>{Math.round(item.completion_rate)}%</span>,
    },
    {
      key: "actions",
      header: "",
      render: (item) => (
        <Link href={`/${locale}/instructor/analytics?course=${item.id}`}>
          <Button variant="ghost" size="sm">
            <BarChart3 className="h-4 w-4 me-1" />
            {t("viewAnalytics")}
          </Button>
        </Link>
      ),
    },
  ];

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
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {t("myCourses")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={courses}
            rowKey={(item) => item.id}
            emptyMessage="No courses assigned yet"
          />
        </CardContent>
      </Card>
    </div>
  );
}
