"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ClipboardList, ClipboardCheck, ArrowRight } from "lucide-react";
import { CertificateList } from "@/components/certificates/CertificateList";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Card, CardContent } from "@/components/ui/card";
import type { Certificate } from "@/types";

interface BlockedCert {
  course_id: string;
  course: { title: string; title_ar: string | null; slug: string };
  reason: "survey" | "knowledge_checks";
  checksRemaining?: number;
  overallPercentage?: number | null;
  requiredScore?: number;
}

export default function CertificatesPage() {
  const t = useTranslations("certificates");
  const tk = useTranslations("knowledgeChecks");
  const locale = useLocale();

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [blocked, setBlocked] = useState<BlockedCert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/certificates").then((r) => r.json()),
      fetch("/api/learner/certificates/blocked").then((r) => r.json()),
    ])
      .then(([certs, blockedRes]) => {
        setCertificates(certs.data ?? []);
        setBlocked(blockedRes.data ?? []);
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const blockedBySurvey = blocked.filter((b) => b.reason === "survey");
  const blockedByChecks = blocked.filter(
    (b) => b.reason === "knowledge_checks"
  );
  const courseTitle = (b: BlockedCert) =>
    locale === "ar" && b.course.title_ar ? b.course.title_ar : b.course.title;

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">
        {t("myCertificates")}
      </h1>

      {blockedBySurvey.length > 0 && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="space-y-3 py-4">
            <div className="flex items-start gap-3">
              <ClipboardList className="mt-0.5 h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-200">
                  Complete the course survey to unlock your certificate
                </p>
                <p className="mt-1 text-sm text-amber-800/80 dark:text-amber-200/80">
                  These courses are complete but require a short survey before
                  the certificate (and badge) is issued.
                </p>
              </div>
            </div>
            <ul className="space-y-2 ps-8">
              {blockedBySurvey.map((b) => (
                <li key={b.course_id}>
                  <Link
                    href={`/${locale}/courses/${b.course.slug}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-amber-900 underline-offset-2 hover:underline dark:text-amber-200"
                  >
                    {courseTitle(b)}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {blockedByChecks.length > 0 && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="space-y-3 py-4">
            <div className="flex items-start gap-3">
              <ClipboardCheck className="mt-0.5 h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-200">
                  {tk("blockedHeading")}
                </p>
                <p className="mt-1 text-sm text-amber-800/80 dark:text-amber-200/80">
                  {tk("blockedDescription")}
                </p>
              </div>
            </div>
            <ul className="space-y-2 ps-8">
              {blockedByChecks.map((b) => (
                <li key={b.course_id}>
                  <Link
                    href={`/${locale}/courses/${b.course.slug}/results`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-amber-900 underline-offset-2 hover:underline dark:text-amber-200"
                  >
                    {courseTitle(b)}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                  <span className="ms-2 text-xs text-amber-800/80 dark:text-amber-200/80">
                    {b.checksRemaining && b.checksRemaining > 0
                      ? tk("blockedNotAllAttempted", {
                          remaining: b.checksRemaining,
                        })
                      : tk("blockedBelowScore", {
                          required: b.requiredScore ?? 0,
                        })}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <CertificateList certificates={certificates} />
    </div>
  );
}
