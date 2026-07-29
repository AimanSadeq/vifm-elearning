"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  BookOpen,
  Users,
  Star,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { StatCard } from "@/components/analytics/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { formatRelativeDate } from "@/lib/utils/formatters";

import { fetchAdminProfiles } from "@/lib/api/admin-profiles";
interface InstructorStats {
  totalCourses: number;
  totalStudents: number;
  averageRating: number;
  avgCompletionRate: number;
}

interface RecentEnrollment {
  id: string;
  user_name: string;
  user_email: string;
  course_title: string;
  enrolled_at: string;
  status: string;
}

export default function InstructorDashboardPage() {
  const t = useTranslations("instructor");
  const { user, isLoading: authLoading } = useAuth();

  const [stats, setStats] = useState<InstructorStats>({
    totalCourses: 0,
    totalStudents: 0,
    averageRating: 0,
    avgCompletionRate: 0,
  });
  const [recentEnrollments, setRecentEnrollments] = useState<
    RecentEnrollment[]
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
      const { data: courses } = await supabase
        .from("courses")
        .select("id, enrollment_count, average_rating, completion_rate")
        .eq("instructor_id", user.id);

      const courseList = courses ?? [];
      const courseIds = courseList.map((c) => c.id);

      const totalStudents = courseList.reduce(
        (sum, c) => sum + (c.enrollment_count || 0),
        0
      );
      const avgRating =
        courseList.length > 0
          ? courseList.reduce((sum, c) => sum + (c.average_rating || 0), 0) /
            courseList.length
          : 0;
      const avgCompletion =
        courseList.length > 0
          ? courseList.reduce(
              (sum, c) => sum + (c.completion_rate || 0),
              0
            ) / courseList.length
          : 0;

      setStats({
        totalCourses: courseList.length,
        totalStudents,
        averageRating: Math.round(avgRating * 10) / 10,
        avgCompletionRate: Math.round(avgCompletion),
      });

      // Fetch recent enrollments for instructor's courses
      if (courseIds.length > 0) {
        const { data: enrollments } = await supabase
          .from("enrollments")
          .select(
            `
            id,
            enrolled_at,
            status,
            user_id,
            user:profiles!enrollments_user_id_fkey(full_name),
            course:courses!enrollments_course_id_fkey(title)
          `
          )
          .in("course_id", courseIds)
          .order("enrolled_at", { ascending: false })
          .limit(10);

        // profiles.email is private to `authenticated`. The admin-profiles
        // route lets an instructor resolve it, but only for learners enrolled
        // in a course they actually teach.
        const emailById = new Map<string, string>();
        const studentIds = [
          ...new Set(
            (enrollments ?? [])
              .map((e) => (e as Record<string, unknown>).user_id as string)
              .filter(Boolean)
          ),
        ];
        if (studentIds.length) {
          const { rows } = await fetchAdminProfiles({ ids: studentIds, pageSize: studentIds.length });
          rows.forEach((r) => emailById.set(r.id, r.email ?? ""));
        }

        const mapped: RecentEnrollment[] = (enrollments ?? []).map(
          (e: Record<string, unknown>) => ({
            id: e.id as string,
            user_name:
              (e.user as Record<string, unknown>)?.full_name as string ??
              "Unknown",
            user_email: emailById.get(e.user_id as string) ?? "",
            course_title:
              (e.course as Record<string, unknown>)?.title as string ??
              "Unknown",
            enrolled_at: e.enrolled_at as string,
            status: e.status as string,
          })
        );
        setRecentEnrollments(mapped);
      }

      setIsLoading(false);
    }

    if (!authLoading) fetchData();
  }, [user, authLoading]);

  const enrollmentColumns: Column<RecentEnrollment>[] = [
    {
      key: "user",
      header: "Student",
      render: (item) => (
        <div>
          <p className="font-medium">{item.user_name}</p>
          <p className="text-xs text-muted-foreground">{item.user_email}</p>
        </div>
      ),
    },
    {
      key: "course",
      header: "Course",
      render: (item) => <span>{item.course_title}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (item) => (
        <Badge
          variant={
            item.status === "completed"
              ? "success"
              : item.status === "active"
                ? "info"
                : "secondary"
          }
        >
          {item.status}
        </Badge>
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (item) => (
        <span className="text-muted-foreground">
          {formatRelativeDate(item.enrolled_at)}
        </span>
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
      <h1 className="font-heading text-2xl font-bold">{t("dashboard")}</h1>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={BookOpen}
          label={t("totalCourses")}
          value={stats.totalCourses.toLocaleString()}
          color="text-brand-600"
          bg="bg-brand-50"
        />
        <StatCard
          icon={Users}
          label={t("totalStudents")}
          value={stats.totalStudents.toLocaleString()}
          color="text-info"
          bg="bg-info/10"
        />
        <StatCard
          icon={Star}
          label={t("averageRating")}
          value={stats.averageRating > 0 ? `${stats.averageRating} ★` : "—"}
          color="text-warning"
          bg="bg-warning/10"
        />
        <StatCard
          icon={TrendingUp}
          label={t("completionRate")}
          value={`${stats.avgCompletionRate}%`}
          color="text-success"
          bg="bg-success/10"
        />
      </div>

      {/* Recent Enrollments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{t("recentEnrollments")}</CardTitle>
          <UserPlus className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <DataTable
            columns={enrollmentColumns}
            data={recentEnrollments}
            rowKey={(item) => item.id}
            emptyMessage="No enrollments yet"
          />
        </CardContent>
      </Card>
    </div>
  );
}
