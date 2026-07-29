"use client";

import { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  GraduationCap,
  Download,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { StatCard } from "@/components/analytics/StatCard";
import { EnrollmentBarChart } from "@/components/analytics/charts/EnrollmentBarChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { LearnerDetailModal } from "@/components/admin/LearnerDetailModal";
import { formatRelativeDate } from "@/lib/utils/formatters";
import { exportToCSV } from "@/lib/utils/csv-export";

import { countAdminProfiles, fetchAdminProfiles } from "@/lib/api/admin-profiles";
interface MonthlyEnrollment {
  month: string;
  enrollments: number;
  completions: number;
}

interface LearnerRow {
  id: string;
  full_name: string;
  email: string;
  enrolled_courses: number;
  completed_courses: number;
  created_at: string;
}

export default function LearnersAnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [totalLearners, setTotalLearners] = useState(0);
  const [activeLearners, setActiveLearners] = useState(0);
  const [totalCompletions, setTotalCompletions] = useState(0);
  const [monthlyData, setMonthlyData] = useState<MonthlyEnrollment[]>([]);
  const [topLearners, setTopLearners] = useState<LearnerRow[]>([]);
  const [selectedLearner, setSelectedLearner] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    async function fetchLearners() {
      const supabase = createClient();

      const [
        { count: learnersCount },
        { count: activeCount },
        { count: completionsCount },
        { data: enrollments },
        { data: learners },
      ] = await Promise.all([
        // role / is_active / email are private on profiles — every read of
        // them now goes through the service-role admin route.
        countAdminProfiles({ role: "learner" }).then((count) => ({ count })),
        countAdminProfiles({ role: "learner", isActive: true }).then((count) => ({ count })),
        supabase
          .from("enrollments")
          .select("*", { count: "exact", head: true })
          .eq("status", "completed"),
        supabase
          .from("enrollments")
          .select("enrolled_at, status"),
        fetchAdminProfiles({
          role: "learner",
          orderBy: "created_at",
          pageSize: 20,
        }).then(({ rows }) => ({ data: rows })),
      ]);

      setTotalLearners(learnersCount ?? 0);
      setActiveLearners(activeCount ?? 0);
      setTotalCompletions(completionsCount ?? 0);

      // Build monthly enrollment data
      const monthlyMap = new Map<
        string,
        { enrollments: number; completions: number }
      >();
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleString("en-US", {
          month: "short",
          year: "2-digit",
        });
        monthlyMap.set(key, { enrollments: 0, completions: 0 });
      }

      enrollments?.forEach((e) => {
        const d = new Date(e.enrolled_at);
        const key = d.toLocaleString("en-US", {
          month: "short",
          year: "2-digit",
        });
        const entry = monthlyMap.get(key);
        if (entry) {
          entry.enrollments += 1;
          if (e.status === "completed") {
            entry.completions += 1;
          }
        }
      });

      setMonthlyData(
        Array.from(monthlyMap.entries()).map(([month, values]) => ({
          month,
          ...values,
        }))
      );

      // For each learner, count their enrollments
      if (learners && learners.length > 0) {
        const learnerIds = learners.map(
          (l: Record<string, unknown>) => l.id as string
        );
        const { data: learnerEnrollments } = await supabase
          .from("enrollments")
          .select("user_id, status")
          .in("user_id", learnerIds);

        const enrollmentCounts = new Map<
          string,
          { enrolled: number; completed: number }
        >();
        learnerEnrollments?.forEach((e) => {
          const counts = enrollmentCounts.get(e.user_id) || {
            enrolled: 0,
            completed: 0,
          };
          counts.enrolled += 1;
          if (e.status === "completed") counts.completed += 1;
          enrollmentCounts.set(e.user_id, counts);
        });

        setTopLearners(
          learners.map((l: Record<string, unknown>) => {
            const counts = enrollmentCounts.get(l.id as string) || {
              enrolled: 0,
              completed: 0,
            };
            return {
              id: l.id as string,
              full_name: (l.full_name as string) || "—",
              email: (l.email as string) || "",
              enrolled_courses: counts.enrolled,
              completed_courses: counts.completed,
              created_at: l.created_at as string,
            };
          })
        );
      }

      setIsLoading(false);
    }

    fetchLearners();
  }, []);

  const learnerColumns: Column<LearnerRow>[] = [
    {
      key: "name",
      header: "Name",
      render: (item) => (
        <div>
          <p className="font-medium">{item.full_name}</p>
          <p className="text-xs text-muted-foreground">{item.email}</p>
        </div>
      ),
    },
    {
      key: "enrolled",
      header: "Enrolled",
      render: (item) => <span>{item.enrolled_courses}</span>,
    },
    {
      key: "completed",
      header: "Completed",
      render: (item) => (
        <Badge variant={item.completed_courses > 0 ? "success" : "secondary"}>
          {item.completed_courses}
        </Badge>
      ),
    },
    {
      key: "joined",
      header: "Joined",
      render: (item) => (
        <span className="text-sm text-muted-foreground">
          {formatRelativeDate(item.created_at)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (item) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setSelectedLearner({ id: item.id, name: item.full_name })
          }
        >
          View
        </Button>
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
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Learner Analytics</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            exportToCSV(topLearners, "learners-data", [
              { key: "full_name", header: "Name" },
              { key: "email", header: "Email" },
              { key: "enrolled_courses", header: "Enrolled Courses" },
              { key: "completed_courses", header: "Completed Courses" },
              { key: "created_at", header: "Joined" },
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
          icon={Users}
          label="Total Learners"
          value={totalLearners.toLocaleString()}
          color="text-brand-600"
          bg="bg-brand-50"
        />
        <StatCard
          icon={UserCheck}
          label="Active Learners"
          value={activeLearners.toLocaleString()}
          color="text-info"
          bg="bg-info/10"
        />
        <StatCard
          icon={GraduationCap}
          label="Course Completions"
          value={totalCompletions.toLocaleString()}
          color="text-success"
          bg="bg-success/10"
        />
      </div>

      {/* Enrollment Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Enrollment Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <EnrollmentBarChart data={monthlyData} />
        </CardContent>
      </Card>

      {/* Learners Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Learners</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={learnerColumns}
            data={topLearners}
            rowKey={(item) => item.id}
            emptyMessage="No learners yet"
          />
        </CardContent>
      </Card>

      {selectedLearner && (
        <LearnerDetailModal
          learnerId={selectedLearner.id}
          learnerName={selectedLearner.name}
          onClose={() => setSelectedLearner(null)}
        />
      )}
    </div>
  );
}
