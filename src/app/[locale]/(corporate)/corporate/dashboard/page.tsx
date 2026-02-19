"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Users, BookOpen, TrendingUp, CreditCard } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { formatDate } from "@/lib/utils/formatters";

interface CorporateStats {
  totalEmployees: number;
  totalEnrollments: number;
  completionRate: number;
  seatsUsed: number;
  maxSeats: number;
  licenseType: string;
  licenseEnd: string | null;
}

export default function CorporateDashboardPage() {
  const t = useTranslations("corporate");
  const { user, isLoading: authLoading } = useAuth();

  const [stats, setStats] = useState<CorporateStats>({
    totalEmployees: 0,
    totalEnrollments: 0,
    completionRate: 0,
    seatsUsed: 0,
    maxSeats: 0,
    licenseType: "per_seat",
    licenseEnd: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!user?.organization_id) {
        setIsLoading(false);
        return;
      }

      const supabase = createClient();
      const orgId = user.organization_id;

      const [orgRes, employeesRes, enrollmentsRes] = await Promise.all([
        supabase
          .from("organizations")
          .select("max_seats, license_type, license_end_date")
          .eq("id", orgId)
          .single(),
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", orgId),
        supabase
          .from("enrollments")
          .select("status")
          .eq("organization_id", orgId),
      ]);

      const enrollmentsList = enrollmentsRes.data ?? [];
      const completed = enrollmentsList.filter((e) => e.status === "completed").length;
      const total = enrollmentsList.length;

      setStats({
        totalEmployees: employeesRes.count ?? 0,
        totalEnrollments: total,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        seatsUsed: employeesRes.count ?? 0,
        maxSeats: orgRes.data?.max_seats || 0,
        licenseType: orgRes.data?.license_type || "per_seat",
        licenseEnd: orgRes.data?.license_end_date || null,
      });

      setIsLoading(false);
    }

    if (!authLoading) fetchStats();
  }, [user, authLoading]);

  if (isLoading || authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const statCards = [
    {
      icon: Users,
      label: t("employees"),
      value: stats.totalEmployees.toString(),
      color: "text-info",
      bg: "bg-info/10",
    },
    {
      icon: BookOpen,
      label: t("totalSeats"),
      value: `${stats.seatsUsed} / ${stats.maxSeats || "∞"}`,
      color: "text-brand-600",
      bg: "bg-brand-50",
    },
    {
      icon: TrendingUp,
      label: "Completion Rate",
      value: `${stats.completionRate}%`,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      icon: CreditCard,
      label: t("licenses"),
      value: stats.licenseType.replace("_", " "),
      color: "text-accent-600",
      bg: "bg-accent-50",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">{t("dashboard")}</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-6">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full ${stat.bg}`}
              >
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* License Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">License Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">License Type</p>
              <p className="font-medium capitalize">{stats.licenseType.replace("_", " ")}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Seats</p>
              <p className="font-medium">
                {stats.seatsUsed} used of {stats.maxSeats || "unlimited"}
              </p>
            </div>
            {stats.licenseEnd && (
              <div>
                <p className="text-sm text-muted-foreground">Expires</p>
                <p className="font-medium">{formatDate(stats.licenseEnd)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
