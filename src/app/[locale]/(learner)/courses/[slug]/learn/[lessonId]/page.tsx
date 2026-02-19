"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { CoursePlayer } from "@/components/courses/CoursePlayer";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { useVideoProgress } from "@/components/video/VideoProgress";
import { QuizGate } from "@/components/quizzes/QuizGate";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThreadList } from "@/components/forums/ThreadList";
import type { Course, Module, Lesson, LessonProgress } from "@/types";

export default function LessonPage() {
  const params = useParams();
  const slug = params.slug as string;
  const lessonId = params.lessonId as string;
  const locale = useLocale();
  const t = useTranslations("courses");
  const { user } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, LessonProgress>>({});
  const [overallProgress, setOverallProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showDiscussion, setShowDiscussion] = useState(false);

  // Get flat list of all lessons for prev/next navigation
  const allLessons = modules.flatMap((m) => m.lessons ?? []);
  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const { saveProgress, markComplete } = useVideoProgress({
    userId: user?.id ?? "",
    lessonId,
    courseId: course?.id ?? "",
  });

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      // Fetch course
      const { data: courseData } = await supabase
        .from("courses")
        .select("*")
        .eq("slug", slug)
        .single();

      if (!courseData) {
        setIsLoading(false);
        return;
      }
      setCourse(courseData as Course);

      // Fetch modules with lessons
      const { data: modulesData } = await supabase
        .from("modules")
        .select("*, lessons(*)")
        .eq("course_id", courseData.id)
        .order("sort_order");

      if (modulesData) {
        const sorted = modulesData.map((mod) => ({
          ...mod,
          lessons: (mod.lessons ?? []).sort(
            (a: { sort_order: number }, b: { sort_order: number }) =>
              a.sort_order - b.sort_order
          ),
        }));
        setModules(sorted as Module[]);

        // Find current lesson
        for (const mod of sorted) {
          const found = (mod.lessons ?? []).find(
            (l: { id: string }) => l.id === lessonId
          );
          if (found) {
            setCurrentLesson(found as Lesson);
            break;
          }
        }
      }

      // Fetch user progress
      if (user) {
        const { data: progressData } = await supabase
          .from("lesson_progress")
          .select("*")
          .eq("user_id", user.id)
          .eq("course_id", courseData.id);

        if (progressData) {
          const map: Record<string, LessonProgress> = {};
          for (const p of progressData) {
            map[p.lesson_id] = p as LessonProgress;
          }
          setProgressMap(map);

          // Calculate overall progress
          const totalLessons = modulesData
            ? modulesData.reduce(
                (sum, m) => sum + (m.lessons?.length ?? 0),
                0
              )
            : 0;
          const completedLessons = progressData.filter(
            (p) => p.is_completed
          ).length;
          setOverallProgress(
            totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0
          );
        }
      }

      setIsLoading(false);
    }

    if (slug && lessonId) fetchData();
  }, [slug, lessonId, user]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!course || !currentLesson) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Lesson not found.</p>
      </div>
    );
  }

  const lessonTitle =
    locale === "ar" && currentLesson.title_ar
      ? currentLesson.title_ar
      : currentLesson.title;
  const lessonDescription =
    locale === "ar" && currentLesson.description_ar
      ? currentLesson.description_ar
      : currentLesson.description;

  const existingProgress = progressMap[lessonId];
  const initialTime = existingProgress?.progress_seconds ?? 0;

  return (
    <CoursePlayer
      course={course}
      modules={modules}
      currentLessonId={lessonId}
      progressMap={progressMap}
      overallProgress={overallProgress}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Video / Content */}
        {currentLesson.content_type === "video" && (
          <VideoPlayer
            src={currentLesson.video_url ?? ""}
            hlsSrc={currentLesson.video_hls_url}
            poster={currentLesson.video_thumbnail_url}
            initialTime={initialTime}
            onProgress={saveProgress}
            onComplete={markComplete}
          />
        )}

        {currentLesson.content_type === "document" && currentLesson.content_html && (
          <div
            className="prose prose-brand max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: currentLesson.content_html }}
          />
        )}

        {currentLesson.content_type === "quiz" && course && (
          <QuizGate lessonId={lessonId} courseId={course.id} />
        )}

        {/* Lesson info */}
        <div>
          <h1 className="font-heading text-2xl font-bold">{lessonTitle}</h1>
          {lessonDescription && (
            <p className="mt-2 text-muted-foreground">{lessonDescription}</p>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between border-t pt-4">
          {prevLesson ? (
            <Link
              href={`/${locale}/courses/${slug}/learn/${prevLesson.id}`}
            >
              <Button variant="outline" size="sm">
                <ChevronLeft className="h-4 w-4 me-1 rtl:rotate-180" />
                {t("overview") === "Overview" ? "Previous" : "السابق"}
              </Button>
            </Link>
          ) : (
            <div />
          )}

          {nextLesson ? (
            <Link
              href={`/${locale}/courses/${slug}/learn/${nextLesson.id}`}
            >
              <Button size="sm">
                {t("overview") === "Overview" ? "Next Lesson" : "الدرس التالي"}
                <ChevronRight className="h-4 w-4 ms-1 rtl:rotate-180" />
              </Button>
            </Link>
          ) : (
            <div />
          )}
        </div>

        {/* Discussion Tab */}
        <div className="border-t pt-4">
          <Button
            variant={showDiscussion ? "default" : "outline"}
            size="sm"
            onClick={() => setShowDiscussion(!showDiscussion)}
          >
            <MessageSquare className="h-4 w-4 me-2" />
            {t("forum")}
          </Button>

          {showDiscussion && course && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">{t("forum")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ThreadList courseId={course.id} lessonId={lessonId} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </CoursePlayer>
  );
}
