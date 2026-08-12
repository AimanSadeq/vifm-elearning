"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { ClipboardList, ExternalLink, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import type {
  SurveyAggregate,
  SurveyQuestion,
} from "@/types/survey";

interface SurveyRow {
  id: string;
  course_id: string;
  survey_kind: "completion" | "followup";
  title: string | null;
  title_ar: string | null;
  is_required: boolean;
  is_active: boolean;
  created_at: string;
  response_count: number;
  course: { title: string; title_ar: string | null; slug: string } | null;
}

export default function AdminSurveysPage() {
  const locale = useLocale();
  const [rows, setRows] = useState<SurveyRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<SurveyRow | null>(null);

  useEffect(() => {
    fetch("/api/admin/surveys")
      .then((r) => r.json())
      .then((j) => setRows(j.data ?? []))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const columns: Column<SurveyRow>[] = [
    {
      key: "course",
      header: "Course",
      render: (r) => (
        <div>
          <p className="font-medium text-sm">
            {r.course?.title ?? "—"}
          </p>
          {r.course?.title_ar && (
            <p className="text-xs text-muted-foreground" dir="rtl">
              {r.course.title_ar}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "title",
      header: "Survey title",
      render: (r) => (
        <span className="text-sm">{r.title ?? "Untitled"}</span>
      ),
    },
    {
      key: "kind",
      header: "Type",
      render: (r) => (
        <Badge variant={r.survey_kind === "followup" ? "info" : "secondary"}>
          {r.survey_kind === "followup" ? "90-Day Follow-Up" : "Completion"}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          <Badge variant={r.is_active ? "success" : "secondary"}>
            {r.is_active ? "Active" : "Inactive"}
          </Badge>
          {r.is_required && <Badge variant="outline">Required</Badge>}
        </div>
      ),
    },
    {
      key: "responses",
      header: "Responses",
      render: (r) => (
        <span className="text-sm font-medium">{r.response_count}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelected(r)}
            title="View aggregate"
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
          <Link
            href={`/${locale}/admin/courses/${r.course_id}/surveys`}
            className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm hover:bg-muted"
            title="Edit survey"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Course Surveys</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configured per course on the course edit page → Survey tab.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Surveys ({rows.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={rows}
            rowKey={(r) => r.id}
            emptyMessage="No surveys yet. Add one from a course edit page."
          />
        </CardContent>
      </Card>

      {selected && (
        <AggregatePanel
          surveyId={selected.id}
          surveyTitle={selected.title ?? "Untitled"}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function AggregatePanel({
  surveyId,
  surveyTitle,
  onClose,
}: {
  surveyId: string;
  surveyTitle: string;
  onClose: () => void;
}) {
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [aggregates, setAggregates] = useState<SurveyAggregate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/surveys/${surveyId}/responses?aggregate=1`)
      .then((r) => r.json())
      .then((j) => {
        setQuestions(j.questions ?? []);
        setAggregates(j.aggregates ?? []);
      })
      .finally(() => setIsLoading(false));
  }, [surveyId]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Results {surveyTitle}</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-6 text-center">
            <LoadingSpinner size="sm" />
          </div>
        ) : (
          <div className="space-y-6">
            {questions.map((q, i) => {
              const agg = aggregates.find((a) => a.questionId === q.id);
              if (!agg) return null;
              return (
                <div
                  key={q.id}
                  className="rounded-lg border border-border p-4"
                >
                  <p className="text-sm font-medium">
                    Q{i + 1}. {q.question_text}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {agg.responseCount} response
                    {agg.responseCount === 1 ? "" : "s"}
                    {" · "}
                    {q.question_type.replace("_", " ")}
                  </p>

                  {q.question_type === "rating" && agg.average !== undefined && (
                    <p className="mt-2 text-2xl font-semibold">
                      {agg.average.toFixed(2)} / 5
                    </p>
                  )}

                  {q.question_type === "nps" && (
                    <div className="mt-2 flex gap-6">
                      <div>
                        <p className="text-2xl font-semibold">
                          {agg.npsScore ?? "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">NPS</p>
                      </div>
                      <div>
                        <p className="text-lg">
                          {agg.average?.toFixed(1) ?? "—"} / 10
                        </p>
                        <p className="text-xs text-muted-foreground">Avg score</p>
                      </div>
                    </div>
                  )}

                  {q.question_type === "multiple_choice" &&
                    agg.distribution && (
                      <div className="mt-2 space-y-1">
                        {Object.entries(agg.distribution).map(([k, v]) => (
                          <div
                            key={k}
                            className="flex items-center justify-between text-sm"
                          >
                            <span>{k}</span>
                            <span className="text-muted-foreground">
                              {v}{" "}
                              {agg.responseCount > 0 &&
                                `(${Math.round((v / agg.responseCount) * 100)}%)`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                  {q.question_type === "free_text" &&
                    agg.sampleResponses &&
                    agg.sampleResponses.length > 0 && (
                      <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                        {agg.sampleResponses.map((r, idx) => (
                          <p
                            key={idx}
                            className="rounded border border-border bg-muted/30 p-2 text-sm"
                          >
                            “{r}”
                          </p>
                        ))}
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
