"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  Award,
  CheckCircle2,
  XCircle,
  CircleDashed,
  AlertTriangle,
  ArrowRight,
  Download,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { cn } from "@/lib/utils/cn";

interface CheckRow {
  quizId: string;
  lessonId: string | null;
  title: string;
  titleAr: string | null;
  isFinalExam: boolean;
  passingScore: number;
  attemptCount: number;
  attempted: boolean;
  bestPercentage: number | null;
  pointsEarned: number;
  pointsAvailable: number;
  passed: boolean;
  lastAttemptAt: string | null;
}

interface Summary {
  requiredScore: number;
  checks: CheckRow[];
  totalChecks: number;
  attemptedChecks: number;
  passedChecks: number;
  pointsEarned: number;
  pointsAvailable: number;
  overallPercentage: number | null;
  allAttempted: boolean;
  gateActive: boolean;
  meetsRequirement: boolean;
  reason: "ok" | "not_all_attempted" | "below_required_score";
}

interface Payload {
  course: {
    id: string;
    title: string;
    titleAr: string | null;
    slug: string;
    certificateEnabled: boolean;
  };
  summary: Summary;
  certificate: {
    id: string;
    certificate_number: string;
    pdf_url: string | null;
  } | null;
}

interface KnowledgeCheckSummaryProps {
  /** Course id or slug. */
  courseRef: string;
  /** Hide the course heading when the host page already shows one. */
  hideHeading?: boolean;
}

export function KnowledgeCheckSummary({
  courseRef,
  hideHeading = false,
}: KnowledgeCheckSummaryProps) {
  const locale = useLocale();
  const t = useTranslations("knowledgeChecks");

  const [data, setData] = useState<Payload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/courses/${courseRef}/knowledge-checks`)
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error ?? "Failed to load results");
        return body.data as Payload;
      })
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [courseRef]);

  if (isLoading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          {error ?? t("loadFailed")}
        </CardContent>
      </Card>
    );
  }

  const { course, summary, certificate } = data;
  const courseTitle =
    locale === "ar" && course.titleAr ? course.titleAr : course.title;

  if (summary.totalChecks === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          {t("noChecks")}
        </CardContent>
      </Card>
    );
  }

  const overall = summary.overallPercentage ?? 0;
  const meets = summary.meetsRequirement;
  const firstOutstanding =
    summary.checks.find((c) => !c.attempted) ??
    summary.checks.find((c) => !c.passed);

  return (
    <div className="space-y-6">
      {!hideHeading && (
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{courseTitle}</p>
        </div>
      )}

      {/* Overall result */}
      <Card>
        <CardContent className="space-y-5 py-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {t("overallScore")}
              </p>
              <p
                className={cn(
                  "font-heading text-4xl font-bold",
                  meets ? "text-emerald-600" : "text-amber-600"
                )}
              >
                {overall}%
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("pointsOf", {
                  earned: summary.pointsEarned,
                  total: summary.pointsAvailable,
                })}
              </p>
            </div>
            <div className="text-end">
              <p className="text-sm text-muted-foreground">
                {t("requiredScore")}
              </p>
              <p className="font-heading text-2xl font-semibold text-foreground">
                {summary.requiredScore}%
              </p>
            </div>
          </div>

          <Progress value={Math.min(100, overall)} className="h-2" />

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xl font-bold text-foreground">
                {summary.totalChecks}
              </p>
              <p className="text-xs text-muted-foreground">{t("total")}</p>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xl font-bold text-foreground">
                {summary.attemptedChecks}
              </p>
              <p className="text-xs text-muted-foreground">{t("attempted")}</p>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xl font-bold text-foreground">
                {summary.passedChecks}
              </p>
              <p className="text-xs text-muted-foreground">{t("passed")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certificate status */}
      {course.certificateEnabled && (
        <Card
          className={cn(
            certificate
              ? "border-emerald-500/40 bg-emerald-500/5"
              : "border-amber-500/40 bg-amber-500/5"
          )}
        >
          <CardContent className="space-y-3 py-4">
            <div className="flex items-start gap-3">
              {certificate ? (
                <Award className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              ) : (
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              )}
              <div className="min-w-0">
                <p className="font-medium text-foreground">
                  {certificate
                    ? t("certificateIssued")
                    : summary.reason === "not_all_attempted"
                      ? t("blockedNotAllAttempted", {
                          remaining:
                            summary.totalChecks - summary.attemptedChecks,
                        })
                      : summary.reason === "below_required_score"
                        ? t("blockedBelowScore", {
                            required: summary.requiredScore,
                          })
                        : t("certificatePending")}
                </p>
                {certificate && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {certificate.certificate_number}
                  </p>
                )}
              </div>
            </div>

            {certificate ? (
              <Link
                href={`/${locale}/certificates`}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-900 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
              >
                <Download className="h-4 w-4" />
                {t("viewCertificate")}
              </Link>
            ) : (
              firstOutstanding?.lessonId && (
                <Link
                  href={`/${locale}/courses/${course.slug}/learn/${firstOutstanding.lessonId}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-amber-900 underline-offset-2 hover:underline dark:text-amber-200"
                >
                  {t("goToOutstanding")}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              )
            )}
          </CardContent>
        </Card>
      )}

      {/* Per-check breakdown */}
      <Card>
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {summary.checks.map((check) => {
              const checkTitle =
                locale === "ar" && check.titleAr ? check.titleAr : check.title;
              return (
                <li
                  key={check.quizId}
                  className="flex flex-wrap items-center gap-3 px-4 py-3"
                >
                  {!check.attempted ? (
                    <CircleDashed className="h-5 w-5 shrink-0 text-muted-foreground" />
                  ) : check.passed ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                  ) : (
                    <XCircle className="h-5 w-5 shrink-0 text-red-600" />
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {checkTitle}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {check.attempted
                        ? t("attemptsPassMark", {
                            attempts: check.attemptCount,
                            passMark: check.passingScore,
                          })
                        : t("notAttempted")}
                    </p>
                  </div>

                  {check.isFinalExam && (
                    <Badge variant="secondary">{t("finalExam")}</Badge>
                  )}

                  <span
                    className={cn(
                      "w-14 text-end text-sm font-semibold tabular-nums",
                      !check.attempted
                        ? "text-muted-foreground"
                        : check.passed
                          ? "text-emerald-600"
                          : "text-red-600"
                    )}
                  >
                    {check.attempted ? `${check.bestPercentage}%` : "—"}
                  </span>

                  {check.lessonId && (
                    <Link
                      href={`/${locale}/courses/${course.slug}/learn/${check.lessonId}`}
                      className="text-sm font-medium text-primary underline-offset-2 hover:underline"
                    >
                      {check.attempted ? t("retake") : t("take")}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
