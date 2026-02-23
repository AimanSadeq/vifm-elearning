"use client";

import { useTranslations } from "next-intl";
import {
  Trophy,
  XCircle,
  CheckCircle,
  RotateCcw,
  Award,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Quiz } from "@/types";

interface QuestionResult {
  questionId: string;
  correct: boolean;
  pointsEarned: number;
  maxPoints: number;
}

interface QuizResultData {
  score?: number;
  maxScore?: number;
  percentage?: number;
  passed?: boolean;
  attemptNumber?: number;
  questionResults?: QuestionResult[];
  certificate?: {
    id: string;
    certificateNumber: string;
    pdfUrl?: string;
  } | null;
}

interface QuizResultsProps {
  result: Record<string, unknown>;
  quiz: Quiz;
  onRetry: () => void;
}

export function QuizResults({ result, quiz, onRetry }: QuizResultsProps) {
  const tq = useTranslations("quiz");
  const data = result as unknown as QuizResultData;
  const percentage = data.percentage ?? 0;
  const passed = data.passed ?? false;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Score Card */}
      <Card>
        <CardContent className="p-8 text-center space-y-4">
          {passed ? (
            <Trophy className="mx-auto h-16 w-16 text-green-500" />
          ) : (
            <XCircle className="mx-auto h-16 w-16 text-red-500" />
          )}

          <h2 className="text-3xl font-bold">
            {passed ? tq("congratulations") : tq("keepTrying")}
          </h2>

          <p className="text-muted-foreground">
            {passed
              ? tq("youPassed")
              : tq("needToPass", { score: quiz.passing_score })}
          </p>

          {/* Score display */}
          <div className="space-y-2">
            <div className="text-5xl font-bold">
              <span
                className={
                  passed
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }
              >
                {percentage.toFixed(0)}%
              </span>
            </div>
            <Progress
              value={percentage}
              className="h-3 max-w-xs mx-auto"
            />
            <p className="text-sm text-muted-foreground">
              {data.score} / {data.maxScore} {tq("points")}
            </p>
          </div>

          {/* Certificate */}
          {data.certificate && (
            <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 p-4 mt-4">
              <Award className="mx-auto h-8 w-8 text-green-600 dark:text-green-400 mb-2" />
              <p className="font-semibold">{tq("certificateIssued")}</p>
              <p className="text-sm text-muted-foreground">
                Certificate #{data.certificate.certificateNumber}
              </p>
              {data.certificate.pdfUrl && (
                <a
                  href={data.certificate.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm" className="mt-2">
                    <Download className="h-4 w-4 me-1" />
                    {tq("downloadCertificate")}
                  </Button>
                </a>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-center gap-3 pt-4">
            <Button variant="outline" onClick={onRetry}>
              <RotateCcw className="h-4 w-4 me-1" />
              {passed ? tq("viewQuiz") : tq("retryQuiz")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Question breakdown */}
      {data.questionResults && data.questionResults.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">{tq("questionResults")}</h3>
            <div className="space-y-2">
              {data.questionResults.map((qr, idx) => (
                <div
                  key={qr.questionId}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    {qr.correct ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">{tq("question")} {idx + 1}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {qr.pointsEarned} / {qr.maxPoints}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
