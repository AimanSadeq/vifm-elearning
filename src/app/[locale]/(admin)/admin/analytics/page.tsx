"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  DollarSign,
  Users,
  BookOpen,
  TrendingUp,
  ArrowRight,
  Download,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { StatCard } from "@/components/analytics/StatCard";
import { RevenueLineChart } from "@/components/analytics/charts/RevenueLineChart";
import { EnrollmentBarChart } from "@/components/analytics/charts/EnrollmentBarChart";
import { PaymentMethodPieChart } from "@/components/analytics/charts/PaymentMethodPieChart";
import { TopCoursesBarChart } from "@/components/analytics/charts/TopCoursesBarChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { formatCurrency } from "@/lib/utils/formatters";
import { exportToCSV } from "@/lib/utils/csv-export";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

interface MonthlyData {
  month: string;
  revenue: number;
  transactions: number;
  enrollments: number;
  completions: number;
}

interface PaymentMethodData {
  method: string;
  count: number;
  amount: number;
}

interface TopCourseData {
  title: string;
  enrollments: number;
  revenue: number;
}

export default function AnalyticsOverviewPage() {
  const t = useTranslations("admin");

  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalEnrollments: 0,
    activeLearners: 0,
    completionRate: 0,
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodData[]>([]);
  const [topCourses, setTopCourses] = useState<TopCourseData[]>([]);

  useEffect(() => {
    async function fetchAnalytics() {
      const supabase = createClient();

      const [
        { count: enrollmentsCount },
        { count: activeLearners },
        { data: completedEnrollments },
        { data: payments },
        { data: courses },
      ] = await Promise.all([
        supabase
          .from("enrollments")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("role", "learner")
          .eq("is_active", true),
        supabase
          .from("enrollments")
          .select("id", { count: "exact" })
          .eq("status", "completed"),
        supabase
          .from("payments")
          .select("amount, payment_method, created_at, status")
          .eq("status", "completed"),
        supabase
          .from("courses")
          .select("title, enrollment_count")
          .eq("status", "published")
          .order("enrollment_count", { ascending: false })
          .limit(10),
      ]);

      const totalRevenue =
        payments?.reduce((sum, p) => sum + (p.amount || 0), 0) ?? 0;
      const completionRate =
        enrollmentsCount && enrollmentsCount > 0
          ? Math.round(
              ((completedEnrollments?.length ?? 0) / enrollmentsCount) * 100
            )
          : 0;

      setStats({
        totalRevenue,
        totalEnrollments: enrollmentsCount ?? 0,
        activeLearners: activeLearners ?? 0,
        completionRate,
      });

      // Build monthly data from payments
      const monthlyMap = new Map<
        string,
        { revenue: number; transactions: number; enrollments: number; completions: number }
      >();
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleString("en-US", {
          month: "short",
          year: "2-digit",
        });
        monthlyMap.set(key, {
          revenue: 0,
          transactions: 0,
          enrollments: 0,
          completions: 0,
        });
      }

      payments?.forEach((p) => {
        const d = new Date(p.created_at);
        const key = d.toLocaleString("en-US", {
          month: "short",
          year: "2-digit",
        });
        const entry = monthlyMap.get(key);
        if (entry) {
          entry.revenue += p.amount || 0;
          entry.transactions += 1;
        }
      });

      setMonthlyData(
        Array.from(monthlyMap.entries()).map(([month, values]) => ({
          month,
          ...values,
        }))
      );

      // Payment method breakdown
      const methodMap = new Map<string, { count: number; amount: number }>();
      payments?.forEach((p) => {
        const method = p.payment_method || "unknown";
        const entry = methodMap.get(method) || { count: 0, amount: 0 };
        entry.count += 1;
        entry.amount += p.amount || 0;
        methodMap.set(method, entry);
      });
      setPaymentMethods(
        Array.from(methodMap.entries()).map(([method, values]) => ({
          method,
          ...values,
        }))
      );

      // Top courses
      setTopCourses(
        (courses ?? []).map((c: Record<string, unknown>) => ({
          title: (c.title as string) || "",
          enrollments: (c.enrollment_count as number) || 0,
          revenue: 0,
        }))
      );

      setIsLoading(false);
    }

    fetchAnalytics();
  }, []);

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
        <h1 className="font-heading text-2xl font-bold">Analytics Overview</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            exportToCSV(monthlyData, "monthly-analytics", [
              { key: "month", header: "Month" },
              { key: "revenue", header: "Revenue" },
              { key: "transactions", header: "Transactions" },
              { key: "enrollments", header: "Enrollments" },
              { key: "completions", header: "Completions" },
            ])
          }
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

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
          label="Active Learners"
          value={stats.activeLearners.toLocaleString()}
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

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ErrorBoundary>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Revenue Trend</CardTitle>
              <Link href="/admin/analytics/revenue">
                <Button variant="ghost" size="sm">
                  Details <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <RevenueLineChart data={monthlyData} />
            </CardContent>
          </Card>
        </ErrorBoundary>

        <ErrorBoundary>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Enrollments</CardTitle>
              <Link href="/admin/analytics/learners">
                <Button variant="ghost" size="sm">
                  Details <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <EnrollmentBarChart data={monthlyData} />
            </CardContent>
          </Card>
        </ErrorBoundary>

        <ErrorBoundary>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentMethodPieChart data={paymentMethods} />
            </CardContent>
          </Card>
        </ErrorBoundary>

        <ErrorBoundary>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Top Courses</CardTitle>
              <Link href="/admin/analytics/courses">
                <Button variant="ghost" size="sm">
                  Details <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <TopCoursesBarChart data={topCourses} />
            </CardContent>
          </Card>
        </ErrorBoundary>
      </div>
    </div>
  );
}
