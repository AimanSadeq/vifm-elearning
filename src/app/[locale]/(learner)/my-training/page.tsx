"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { CalendarClock, CheckCircle2, MessageSquareText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { CourseSurveyModal } from "@/components/learner/CourseSurveyModal";

interface AssignmentItem {
  id: string;
  course_id: string | null;
  learning_path_id: string | null;
  due_date: string | null;
  is_mandatory: boolean;
  status: "assigned" | "completed" | "cancelled";
  completed_at: string | null;
  created_at: string;
  course: {
    title: string | null;
    title_ar: string | null;
    slug: string | null;
  } | null;
  learning_path: {
    title: string | null;
    title_ar: string | null;
    slug: string | null;
  } | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export default function MyTrainingPage() {
  const locale = useLocale();
  const t = useTranslations("myTraining");
  const { user, isLoading: authLoading } = useAuth();

  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [progressMap, setProgressMap] = useState<Map<string, number>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "open" | "completed">("all");
  // course_ids with an active followup/impact survey the learner hasn't answered
  const [pendingFollowups, setPendingFollowups] = useState<Set<string>>(
    new Set(),
  );
  const [pendingImpacts, setPendingImpacts] = useState<Set<string>>(new Set());
  const [followupCourseId, setFollowupCourseId] = useState<string | null>(null);
  const [impactCourseId, setImpactCourseId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      const supabase = createClient();

      const { data } = await supabase
        .from("training_assignments")
        .select(
          `id, course_id, learning_path_id, due_date, is_mandatory, status,
           completed_at, created_at,
           course:courses(title, title_ar, slug),
           learning_path:learning_paths(title, title_ar, slug)`,
        )
        .eq("user_id", user.id)
        .neq("status", "cancelled")
        .order("due_date", { ascending: true, nullsFirst: false });

      const items = (data as unknown as AssignmentItem[]) ?? [];
      setAssignments(items);

      // Progress for each assignment target.
      const courseIds = items
        .map((a) => a.course_id)
        .filter((id): id is string => Boolean(id));
      const pathIds = items
        .map((a) => a.learning_path_id)
        .filter((id): id is string => Boolean(id));

      const map = new Map<string, number>();
      if (courseIds.length > 0) {
        const { data: enr } = await supabase
          .from("enrollments")
          .select("course_id, progress_percentage")
          .eq("user_id", user.id)
          .in("course_id", courseIds);
        (enr ?? []).forEach((e) =>
          map.set(`c:${e.course_id}`, Number(e.progress_percentage) || 0),
        );
      }
      if (pathIds.length > 0) {
        const { data: enr } = await supabase
          .from("learning_path_enrollments")
          .select("learning_path_id, progress")
          .eq("user_id", user.id)
          .in("learning_path_id", pathIds);
        (enr ?? []).forEach((e) =>
          map.set(`p:${e.learning_path_id}`, Number(e.progress) || 0),
        );
      }
      setProgressMap(map);

      // Follow-up (L3) and impact (L4) surveys: completed course assignments
      // whose course has an active survey of that kind the learner hasn't
      // answered yet.
      const completedCourseIds = items
        .filter((a) => a.status === "completed" && a.course_id)
        .map((a) => a.course_id as string);
      if (completedCourseIds.length > 0) {
        const { data: fSurveys } = await supabase
          .from("course_surveys")
          .select("id, course_id, survey_kind")
          .in("survey_kind", ["followup", "impact"])
          .eq("is_active", true)
          .in("course_id", completedCourseIds);
        const surveyRows = fSurveys ?? [];
        if (surveyRows.length > 0) {
          const { data: responses } = await supabase
            .from("survey_responses")
            .select("survey_id")
            .eq("user_id", user.id)
            .in(
              "survey_id",
              surveyRows.map((s) => s.id),
            );
          const answered = new Set((responses ?? []).map((r) => r.survey_id));
          const pending = surveyRows.filter((s) => !answered.has(s.id));
          setPendingFollowups(
            new Set(
              pending
                .filter((s) => s.survey_kind === "followup")
                .map((s) => s.course_id as string),
            ),
          );
          setPendingImpacts(
            new Set(
              pending
                .filter((s) => s.survey_kind === "impact")
                .map((s) => s.course_id as string),
            ),
          );
        }
      }

      setIsLoading(false);
    }

    if (!authLoading) fetchData();
  }, [user, authLoading]);

  const filtered = useMemo(() => {
    if (filter === "open")
      return assignments.filter((a) => a.status === "assigned");
    if (filter === "completed")
      return assignments.filter((a) => a.status === "completed");
    return assignments;
  }, [assignments, filter]);

  if (isLoading || authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <div className="flex items-center gap-2">
          {(["all", "open", "completed"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {t(f)}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title={t("noTraining")}
          description={t("noTrainingDescription")}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => {
            const target = a.course_id ? a.course : a.learning_path;
            const title =
              (locale === "ar" && target?.title_ar
                ? target.title_ar
                : target?.title) ??
              target?.title_ar ??
              "—";
            const href = a.course_id
              ? `/${locale}/courses/${target?.slug ?? ""}`
              : `/${locale}/learning-paths/${target?.slug ?? ""}`;
            const progress =
              progressMap.get(
                a.course_id ? `c:${a.course_id}` : `p:${a.learning_path_id}`,
              ) ?? 0;
            const isCompleted = a.status === "completed";
            const overdue = !isCompleted && !!a.due_date && a.due_date < today;
            const dueSoon =
              !isCompleted &&
              !overdue &&
              !!a.due_date &&
              new Date(a.due_date).getTime() - Date.now() <= 7 * DAY_MS;

            return (
              <Card key={a.id} className={overdue ? "border-destructive/50" : ""}>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={href}
                          className="font-semibold hover:text-brand-600 transition-colors"
                        >
                          {title}
                        </Link>
                        <Badge variant="secondary" className="text-[10px]">
                          {a.course_id ? t("course") : t("learningPath")}
                        </Badge>
                        {a.is_mandatory && (
                          <Badge variant="warning" className="text-[10px]">
                            {t("mandatory")}
                          </Badge>
                        )}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {isCompleted && a.completed_at ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {t("completedOn", {
                              date: a.completed_at.slice(0, 10),
                            })}
                          </span>
                        ) : a.due_date ? (
                          <span
                            className={
                              overdue
                                ? "font-medium text-destructive"
                                : dueSoon
                                  ? "font-medium text-amber-600"
                                  : undefined
                            }
                          >
                            {t("dueBy", { date: a.due_date })}
                          </span>
                        ) : null}
                        {overdue && (
                          <Badge variant="destructive" className="text-[10px]">
                            {t("overdue")}
                          </Badge>
                        )}
                        {dueSoon && (
                          <Badge variant="warning" className="text-[10px]">
                            {t("dueSoon")}
                          </Badge>
                        )}
                      </div>

                      {!isCompleted && (
                        <div className="mt-2 max-w-xs">
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              {t("progress")}
                            </span>
                            <span className="font-medium">
                              {Math.round(progress)}%
                            </span>
                          </div>
                          <Progress value={progress} className="h-1.5" />
                        </div>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {isCompleted ? (
                        <>
                          {a.course_id && pendingFollowups.has(a.course_id) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setFollowupCourseId(a.course_id)}
                            >
                              <MessageSquareText className="me-1.5 h-4 w-4" />
                              {t("followupSurvey")}
                            </Button>
                          )}
                          {a.course_id && pendingImpacts.has(a.course_id) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setImpactCourseId(a.course_id)}
                            >
                              <MessageSquareText className="me-1.5 h-4 w-4" />
                              {t("impactSurvey")}
                            </Button>
                          )}
                          <Badge variant="success">{t("completed")}</Badge>
                        </>
                      ) : (
                        <Link href={href}>
                          <Button size="sm">
                            {progress > 0 ? t("continue") : t("start")}
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {followupCourseId && (
        <CourseSurveyModal
          courseId={followupCourseId}
          kind="followup"
          required={false}
          onSubmitted={() => {
            setPendingFollowups((prev) => {
              const next = new Set(prev);
              next.delete(followupCourseId);
              return next;
            });
            setFollowupCourseId(null);
          }}
          onClose={() => setFollowupCourseId(null)}
        />
      )}

      {impactCourseId && (
        <CourseSurveyModal
          courseId={impactCourseId}
          kind="impact"
          required={false}
          onSubmitted={() => {
            setPendingImpacts((prev) => {
              const next = new Set(prev);
              next.delete(impactCourseId);
              return next;
            });
            setImpactCourseId(null);
          }}
          onClose={() => setImpactCourseId(null)}
        />
      )}
    </div>
  );
}
