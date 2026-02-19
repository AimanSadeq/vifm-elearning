"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useLocale } from "next-intl";
import { ChevronLeft } from "lucide-react";
import { QuizBuilder } from "@/components/quizzes/QuizBuilder";

export default function EditQuizPage() {
  const params = useParams();
  const courseId = params.id as string;
  const quizId = params.quizId as string;
  const locale = useLocale();

  const isNew = quizId === "new";

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/${locale}/admin/courses/${courseId}/quizzes`}
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
          Back to Quizzes
        </Link>
        <h1 className="font-heading text-2xl font-bold">
          {isNew ? "Create Quiz" : "Edit Quiz"}
        </h1>
      </div>

      <QuizBuilder
        courseId={courseId}
        quizId={isNew ? undefined : quizId}
      />
    </div>
  );
}
