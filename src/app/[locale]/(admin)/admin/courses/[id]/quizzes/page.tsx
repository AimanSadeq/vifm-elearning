"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useLocale } from "next-intl";
import { ChevronLeft, Plus, Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import type { Quiz } from "@/types";

export default function CourseQuizzesPage() {
  const params = useParams();
  const courseId = params.id as string;
  const locale = useLocale();

  const [courseTitle, setCourseTitle] = useState("");
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      const { data: course } = await supabase
        .from("courses")
        .select("title")
        .eq("id", courseId)
        .single();

      if (course) setCourseTitle(course.title);

      const res = await fetch(`/api/quizzes?courseId=${courseId}`);
      const { data } = await res.json();
      if (data) setQuizzes(data);

      setIsLoading(false);
    }

    if (courseId) fetchData();
  }, [courseId]);

  const handleDelete = async (quizId: string) => {
    if (!confirm("Delete this quiz and all its questions?")) return;
    const res = await fetch(`/api/quizzes/${quizId}`, { method: "DELETE" });
    if (res.ok) {
      setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
    }
  };

  const columns: Column<Quiz>[] = [
    {
      key: "title",
      header: "Quiz",
      render: (item) => (
        <div>
          <p className="font-medium">{item.title}</p>
          {item.is_final_exam && (
            <Badge variant="warning" className="mt-1 text-xs">
              Final Exam
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "passingScore",
      header: "Passing Score",
      render: (item) => <span>{item.passing_score}%</span>,
    },
    {
      key: "attempts",
      header: "Max Attempts",
      render: (item) => <span>{item.max_attempts}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (item) =>
        item.is_published ? (
          <Badge variant="success">Published</Badge>
        ) : (
          <Badge variant="secondary">Draft</Badge>
        ),
    },
    {
      key: "actions",
      header: "",
      className: "w-24",
      render: (item) => (
        <div className="flex gap-1">
          <Link
            href={`/${locale}/admin/courses/${courseId}/quizzes/${item.id}`}
          >
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-destructive"
            onClick={() => handleDelete(item.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
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
      <div>
        <Link
          href={`/${locale}/admin/courses`}
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
          Back to Courses
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold">Quizzes</h1>
            {courseTitle && (
              <p className="text-muted-foreground">{courseTitle}</p>
            )}
          </div>
          <Link
            href={`/${locale}/admin/courses/${courseId}/quizzes/new`}
          >
            <Button>
              <Plus className="h-4 w-4 me-2" />
              Create Quiz
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader />
        <CardContent>
          <DataTable
            columns={columns}
            data={quizzes}
            isLoading={isLoading}
            rowKey={(item) => item.id}
            emptyMessage="No quizzes yet. Create your first quiz!"
          />
        </CardContent>
      </Card>
    </div>
  );
}
