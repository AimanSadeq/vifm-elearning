"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  DollarSign,
  Users,
  BookOpen,
  TrendingUp,
  UserPlus,
  PlusCircle,
  BarChart3,
  Video,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { StatCard } from "@/components/analytics/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { formatCurrency, formatRelativeDate } from "@/lib/utils/formatters";

interface DashboardStats {
  totalRevenue: number;
  activeUsers: number;
  totalEnrollments: number;
  completionRate: number;
}

interface RecentEnrollment {
  id: string;
  user_name: string;
  user_email: string;
  course_title: string;
  enrolled_at: string;
  status: string;
}

interface TopCourse {
  id: string;
  title: string;
  enrollment_count: number;
  average_rating: number;
  revenue: number;
  status: string;
}

export default function AdminDashboardPage() {
  const t = useTranslations("admin");
  const locale = useLocale();

  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    activeUsers: 0,
    totalEnrollments: 0,
    completionRate: 0,
  });
  const [recentEnrollments, setRecentEnrollments] = useState<
    RecentEnrollment[]
  >([]);
  const [topCourses, setTopCourses] = useState<TopCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      const supabase = createClient();

      // Fetch counts in parallel
      const [
        { count: usersCount },
        { count: enrollmentsCount },
        { count: completedCount },
        { data: payments },
        { data: recentData },
        { data: coursesData },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true),
        supabase
          .from("enrollments")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("enrollments")
          .select("id", { count: "exact", head: true })
          .eq("status", "completed"),
        supabase
          .from("payments")
          .select("amount")
          .eq("status", "completed"),
        supabase
          .from("enrollments")
          .select(
            `
            id,
            enrolled_at,
            status,
            user:profiles!enrollments_user_id_fkey(full_name, email),
            course:courses!enrollments_course_id_fkey(title)
          `
          )
          .order("enrolled_at", { ascending: false })
          .limit(10),
        supabase
          .from("courses")
          .select("id, title, enrollment_count, average_rating, status, payments(amount)")
          .eq("status", "published")
          .eq("payments.status", "completed")
          .order("enrollment_count", { ascending: false })
          .limit(10),
      ]);

      const totalRevenue =
        payments?.reduce((sum, p) => sum + (p.amount || 0), 0) ?? 0;
      const completionRate =
        enrollmentsCount && enrollmentsCount > 0
          ? Math.round(
              ((completedCount ?? 0) / enrollmentsCount) * 100
            )
          : 0;

      setStats({
        totalRevenue,
        activeUsers: usersCount ?? 0,
        totalEnrollments: enrollmentsCount ?? 0,
        completionRate,
      });

      // Map recent enrollments
      const mappedEnrollments: RecentEnrollment[] = (recentData ?? []).map(
        (e: Record<string, unknown>) => ({
          id: e.id as string,
          user_name:
            (e.user as Record<string, unknown>)?.full_name as string ?? "Unknown",
          user_email:
            (e.user as Record<string, unknown>)?.email as string ?? "",
          course_title:
            (e.course as Record<string, unknown>)?.title as string ?? "Unknown",
          enrolled_at: e.enrolled_at as string,
          status: e.status as string,
        })
      );
      setRecentEnrollments(mappedEnrollments);

      // Map top courses
      const mappedCourses: TopCourse[] = (coursesData ?? []).map(
        (c: Record<string, unknown>) => ({
          id: c.id as string,
          title: c.title as string,
          enrollment_count: c.enrollment_count as number,
          average_rating: c.average_rating as number,
          revenue: (
            (c.payments as Array<{ amount: number }>) ?? []
          ).reduce((sum, p) => sum + (p.amount || 0), 0),
          status: c.status as string,
        })
      );
      setTopCourses(mappedCourses);

      setIsLoading(false);
    }

    fetchDashboardData();
  }, []);

  const enrollmentColumns: Column<RecentEnrollment>[] = [
    {
      key: "user",
      header: "User",
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

  const courseColumns: Column<TopCourse>[] = [
    {
      key: "title",
      header: "Course",
      render: (item) => <span className="font-medium">{item.title}</span>,
    },
    {
      key: "enrollments",
      header: "Enrollments",
      render: (item) => <span>{item.enrollment_count}</span>,
    },
    {
      key: "revenue",
      header: "Revenue",
      render: (item) => (
        <span>{formatCurrency(item.revenue)}</span>
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
  ];

  if (isLoading) {
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
          icon={DollarSign}
          label={t("totalRevenue")}
          value={formatCurrency(stats.totalRevenue)}
          color="text-success"
          bg="bg-success/10"
        />
        <StatCard
          icon={Users}
          label={t("activeUsers")}
          value={stats.activeUsers.toLocaleString()}
          color="text-info"
          bg="bg-info/10"
        />
        <StatCard
          icon={BookOpen}
          label={t("totalEnrollments")}
          value={stats.totalEnrollments.toLocaleString()}
          color="text-accent-600"
          bg="bg-accent-50"
        />
        <StatCard
          icon={TrendingUp}
          label={t("completionRate")}
          value={`${stats.completionRate}%`}
          color="text-brand-600"
          bg="bg-brand-50"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link
          href={`/${locale}/admin/courses/new`}
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <PlusCircle className="h-4 w-4" />
          {t("addCourse")}
        </Link>
        <Link
          href={`/${locale}/admin/users`}
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Users className="h-4 w-4" />
          {t("manageUsers")}
        </Link>
        <Link
          href={`/${locale}/admin/analytics`}
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <BarChart3 className="h-4 w-4" />
          {t("viewAnalytics")}
        </Link>
        <Link
          href={`/${locale}/admin/webinars`}
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Video className="h-4 w-4" />
          {t("manageWebinars")}
        </Link>
      </div>

      {/* Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">
              {t("recentEnrollments")}
            </CardTitle>
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">{t("topCourses")}</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <DataTable
              columns={courseColumns}
              data={topCourses}
              rowKey={(item) => item.id}
              emptyMessage="No courses yet"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
