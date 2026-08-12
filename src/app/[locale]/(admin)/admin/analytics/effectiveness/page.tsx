"use client";

import { useEffect, useState } from "react";
import { Send, ClipboardCheck, Percent, Star, Download } from "lucide-react";
import { StatCard } from "@/components/analytics/StatCard";
import { EffectivenessTrendChart } from "@/components/analytics/charts/EffectivenessTrendChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { exportToCSV } from "@/lib/utils/csv-export";

interface SurveyScore {
  responses: number;
  avgRating: number | null;
  nps: number | null;
}

interface CourseEffectivenessRow {
  courseId: string;
  title: string;
  titleAr: string | null;
  isActive: boolean;
  invited: number;
  responded: number;
  responseRate: number | null;
  completion: SurveyScore;
  followup: SurveyScore;
}

interface EffectivenessData {
  totals: {
    invited: number;
    responded: number;
    responseRate: number;
    avgFollowupRating: number | null;
  };
  courses: CourseEffectivenessRow[];
  monthly: { month: string; responses: number; avgRating: number | null }[];
}

const fmtRating = (n: number | null) => (n === null ? "—" : n.toFixed(2));

export default function EffectivenessAnalyticsPage() {
  const [data, setData] = useState<EffectivenessData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics/effectiveness")
      .then((r) => r.json())
      .then((j) => setData(j.totals ? j : null))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const totals = data?.totals ?? {
    invited: 0,
    responded: 0,
    responseRate: 0,
    avgFollowupRating: null,
  };
  const courses = data?.courses ?? [];

  const columns: Column<CourseEffectivenessRow>[] = [
    {
      key: "course",
      header: "Course",
      render: (r) => (
        <div>
          <p className="text-sm font-medium">{r.title}</p>
          <div className="mt-0.5 flex items-center gap-2">
            {r.titleAr && (
              <p className="text-xs text-muted-foreground" dir="rtl">
                {r.titleAr}
              </p>
            )}
            {!r.isActive && <Badge variant="secondary">Inactive</Badge>}
          </div>
        </div>
      ),
    },
    {
      key: "funnel",
      header: "Invited → Responded",
      render: (r) => (
        <div className="text-sm">
          {r.invited} → {r.responded}
          {r.responseRate !== null && (
            <span className="ml-1 text-xs text-muted-foreground">
              ({r.responseRate}%)
            </span>
          )}
        </div>
      ),
    },
    {
      key: "l1",
      header: "Reaction avg (L1)",
      render: (r) => (
        <div className="text-sm">
          {fmtRating(r.completion.avgRating)}
          {r.completion.avgRating !== null && (
            <span className="text-xs text-muted-foreground"> /5</span>
          )}
          {r.completion.nps !== null && (
            <p className="text-xs text-muted-foreground">
              NPS {r.completion.nps}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "l3",
      header: "Applied avg (L3)",
      render: (r) => (
        <div className="text-sm">
          {fmtRating(r.followup.avgRating)}
          {r.followup.avgRating !== null && (
            <span className="text-xs text-muted-foreground"> /5</span>
          )}
          {r.followup.nps !== null && (
            <p className="text-xs text-muted-foreground">
              NPS {r.followup.nps}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "delta",
      header: "Δ L3−L1",
      render: (r) => {
        if (r.completion.avgRating === null || r.followup.avgRating === null)
          return <span className="text-sm text-muted-foreground">—</span>;
        const delta = r.followup.avgRating - r.completion.avgRating;
        return (
          <span
            className={
              delta >= 0
                ? "text-sm font-medium text-success"
                : "text-sm font-medium text-error"
            }
          >
            {delta >= 0 ? "+" : ""}
            {delta.toFixed(2)}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">
            Training Effectiveness
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kirkpatrick evaluation: reaction at completion (Level 1) vs.
            behavior applied at work ~90 days later (Level 3).
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            exportToCSV(
              courses.map((c) => ({
                course: c.title,
                invited: c.invited,
                responded: c.responded,
                response_rate: c.responseRate ?? "",
                reaction_avg_l1: c.completion.avgRating ?? "",
                applied_avg_l3: c.followup.avgRating ?? "",
                nps_l1: c.completion.nps ?? "",
                nps_l3: c.followup.nps ?? "",
              })),
              "training-effectiveness",
              [
                { key: "course", header: "Course" },
                { key: "invited", header: "Invited" },
                { key: "responded", header: "Responded" },
                { key: "response_rate", header: "Response rate %" },
                { key: "reaction_avg_l1", header: "Reaction avg (L1)" },
                { key: "applied_avg_l3", header: "Applied avg (L3)" },
                { key: "nps_l1", header: "NPS (L1)" },
                { key: "nps_l3", header: "NPS (L3)" },
              ],
            )
          }
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Send}
          label="Follow-Ups Invited"
          value={totals.invited.toLocaleString()}
          color="text-info"
          bg="bg-info/10"
        />
        <StatCard
          icon={ClipboardCheck}
          label="Follow-Ups Responded"
          value={totals.responded.toLocaleString()}
          color="text-success"
          bg="bg-success/10"
        />
        <StatCard
          icon={Percent}
          label="Response Rate"
          value={`${totals.responseRate}%`}
        />
        <StatCard
          icon={Star}
          label="Avg Applied Rating (L3)"
          value={
            totals.avgFollowupRating === null
              ? "—"
              : `${totals.avgFollowupRating.toFixed(2)} / 5`
          }
          color="text-warning"
          bg="bg-warning/10"
        />
      </div>

      <ErrorBoundary>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Follow-Up Responses (12 months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EffectivenessTrendChart data={data?.monthly ?? []} />
          </CardContent>
        </Card>
      </ErrorBoundary>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            By Course ({courses.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={courses}
            rowKey={(r) => r.courseId}
            emptyMessage="No courses have a follow-up survey yet. Add one from a course edit page → Survey tab → Follow-Up."
          />
        </CardContent>
      </Card>
    </div>
  );
}
