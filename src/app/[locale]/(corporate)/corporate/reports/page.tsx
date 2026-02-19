"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

interface TeamProgressData {
  name: string;
  enrollments: number;
  completed: number;
}

export default function CorporateReportsPage() {
  const t = useTranslations("corporate");
  const { user, isLoading: authLoading } = useAuth();

  const [progressData, setProgressData] = useState<TeamProgressData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      if (!user?.organization_id) {
        setIsLoading(false);
        return;
      }

      const supabase = createClient();
      const orgId = user.organization_id;

      // Get employees with their enrollment stats
      const { data: employees } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("organization_id", orgId)
        .eq("is_active", true)
        .order("full_name")
        .limit(20);

      if (!employees || employees.length === 0) {
        setIsLoading(false);
        return;
      }

      const employeeIds = employees.map((e) => e.id);

      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("user_id, status")
        .in("user_id", employeeIds);

      const enrollmentMap = new Map<
        string,
        { total: number; completed: number }
      >();

      for (const e of enrollments ?? []) {
        const current = enrollmentMap.get(e.user_id) || {
          total: 0,
          completed: 0,
        };
        current.total++;
        if (e.status === "completed") current.completed++;
        enrollmentMap.set(e.user_id, current);
      }

      const chartData: TeamProgressData[] = employees.map((emp) => {
        const stats = enrollmentMap.get(emp.id) || {
          total: 0,
          completed: 0,
        };
        return {
          name: emp.full_name.split(" ")[0], // First name for chart label
          enrollments: stats.total,
          completed: stats.completed,
        };
      });

      setProgressData(chartData);
      setIsLoading(false);
    }

    if (!authLoading) fetchReports();
  }, [user, authLoading]);

  if (isLoading || authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">{t("teamProgress")}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Employee Course Progress</CardTitle>
        </CardHeader>
        <CardContent>
          {progressData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No employee data available.
            </p>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="enrollments"
                    fill="hsl(var(--brand-400))"
                    name="Enrollments"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="completed"
                    fill="hsl(var(--success))"
                    name="Completed"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
