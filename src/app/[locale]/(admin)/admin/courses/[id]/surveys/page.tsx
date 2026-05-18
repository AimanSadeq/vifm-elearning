"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useLocale } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { SurveyBuilder } from "@/components/admin/SurveyBuilder";

export default function AdminCourseSurveyPage() {
  const params = useParams();
  const courseId = params.id as string;
  const locale = useLocale();

  return (
    <div className="space-y-6">
      <Link
        href={`/${locale}/admin/courses/${courseId}/edit`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to course
      </Link>

      <div>
        <h1 className="font-heading text-2xl font-bold">Course Survey</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Shown to learners after they complete the course. When marked
          required, blocks the certificate and badge until submitted.
        </p>
      </div>

      <SurveyBuilder courseId={courseId} />
    </div>
  );
}
