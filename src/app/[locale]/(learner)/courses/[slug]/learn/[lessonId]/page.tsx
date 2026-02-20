"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, MessageSquare, Bookmark, Lock, Play } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { useSequentialLocking } from "@/lib/hooks/useSequentialLocking";
import { useVideoBookmarks } from "@/lib/hooks/useVideoBookmarks";
import { useWatchStatistics } from "@/lib/hooks/useWatchStatistics";
import { CoursePlayer } from "@/components/courses/CoursePlayer";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { useVideoProgress } from "@/components/video/VideoProgress";
import { BookmarksPanel } from "@/components/video/BookmarksPanel";
import { WatchStatsBadge } from "@/components/video/WatchStatsBadge";
import { QuizGate } from "@/components/quizzes/QuizGate";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThreadList } from "@/components/forums/ThreadList";
import { useCoursePlayerStore } from "@/stores/course-player-store";
import type { Course, Module, Lesson, LessonProgress } from "@/types";

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const lessonId = params.lessonId as string;
  const locale = useLocale();
  const t = useTranslations("courses");
  const tp = useTranslations("player");
  const { user } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [progressMap, setProgressMap] = useState<
    Record<string, LessonProgress>
  >({});
  const [overallProgress, setOverallProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showDiscussion, setShowDiscussion] = useState(false);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);

  const seekToRef = useRef<((seconds: number) => void) | null>(null);

  const {
    isTheaterMode,
    toggleTheaterMode,
    showBookmarksPanel,
    toggleBookmarksPanel,
  } = useCoursePlayerStore();

  // Flat list of all lessons for prev/next navigation
  const allLessons = modules.flatMap((m) => m.lessons ?? []);
  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < allLessons.length - 1
      ? allLessons[currentIndex + 1]
      : null;

  // Video progress hook
  const { saveProgress, markComplete } = useVideoProgress({
    userId: user?.id ?? "",
    lessonId,
    courseId: course?.id ?? "",
  });

  // Sequential locking
  const { lockedLessonIds, isLocked } = useSequentialLocking({
    modules,
    progressMap,
    enabled: course?.sequential_locking_enabled ?? false,
  });

  // Bookmarks
  const {
    bookmarks,
    loading: bookmarksLoading,
    addBookmark,
    updateBookmark,
    deleteBookmark,
  } = useVideoBookmarks({
    userId: user?.id ?? "",
    lessonId,
    courseId: course?.id ?? "",
  });

  // Watch statistics — trackPlay/trackPause/trackSeek called internally by the hook
  const { getStats } = useWatchStatistics({
    userId: user?.id ?? "",
    lessonId,
    courseId: course?.id ?? "",
  });

  // Navigate to next lesson (for autoplay)
  const navigateToNext = useCallback(() => {
    if (nextLesson) {
      router.push(`/${locale}/courses/${slug}/learn/${nextLesson.id}`);
    }
  }, [nextLesson, locale, slug, router]);

  // Data fetching
  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

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

  // Check if current lesson is locked
  const currentLessonLocked = isLocked(lessonId);

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
  const showResumeBanner =
    currentLesson.content_type === "video" && initialTime > 10;

  const stats = getStats();

  return (
    <CoursePlayer
      course={course}
      modules={modules}
      currentLessonId={lessonId}
      progressMap={progressMap}
      overallProgress={overallProgress}
      lockedLessonIds={lockedLessonIds}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Locked state */}
        {currentLessonLocked && (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/50 py-16 gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">{tp("lessonLocked")}</h3>
            <p className="text-sm text-muted-foreground max-w-sm text-center">
              {tp("completePrevious")}
            </p>
          </div>
        )}

        {/* Video / Content — only if not locked */}
        {!currentLessonLocked && (
          <>
            {currentLesson.content_type === "video" && (
              <>
                {/* Resume banner */}
                {showResumeBanner && (
                  <div className="flex items-center justify-between rounded-lg border border-brand-200 bg-brand-50 px-4 py-2.5 dark:border-brand-900 dark:bg-brand-950/30">
                    <span className="text-sm text-brand-700 dark:text-brand-300">
                      {tp("resumeFrom", {
                        time: `${Math.floor(initialTime / 60)}:${Math.floor(initialTime % 60).toString().padStart(2, "0")}`,
                      })}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (seekToRef.current) seekToRef.current(0);
                        }}
                      >
                        {tp("startOver")}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (seekToRef.current)
                            seekToRef.current(initialTime);
                        }}
                      >
                        <Play className="h-3.5 w-3.5 me-1" />
                        {tp("resumeVideo")}
                      </Button>
                    </div>
                  </div>
                )}

                <VideoPlayer
                  src={currentLesson.video_url ?? ""}
                  hlsSrc={currentLesson.video_hls_url}
                  poster={currentLesson.video_thumbnail_url}
                  initialTime={initialTime}
                  onProgress={saveProgress}
                  onComplete={markComplete}
                  captionsEnUrl={currentLesson.captions_en_url}
                  captionsArUrl={currentLesson.captions_ar_url}
                  bookmarks={bookmarks}
                  onSeekTo={seekToRef}
                  restrictSpeed={false}
                  isTheaterMode={isTheaterMode}
                  onTheaterToggle={toggleTheaterMode}
                  nextLesson={
                    nextLesson
                      ? {
                          title:
                            locale === "ar" && nextLesson.title_ar
                              ? nextLesson.title_ar
                              : nextLesson.title,
                          onPlay: navigateToNext,
                        }
                      : null
                  }
                  onTimeUpdate={setVideoCurrentTime}
                  userId={user?.id}
                  lessonId={lessonId}
                  courseId={course.id}
                />

                {/* Stats and bookmarks toggle row */}
                <div className="flex items-center justify-between">
                  <WatchStatsBadge
                    watchTimeSeconds={
                      existingProgress?.total_watch_time_seconds ??
                      stats.totalWatchTime
                    }
                    completionPercent={
                      existingProgress?.is_completed
                        ? 100
                        : existingProgress?.progress_seconds &&
                            currentLesson.video_duration_seconds
                          ? Math.round(
                              (existingProgress.progress_seconds /
                                currentLesson.video_duration_seconds) *
                                100
                            )
                          : 0
                    }
                    viewCount={stats.playCount}
                  />
                  <Button
                    variant={showBookmarksPanel ? "default" : "outline"}
                    size="sm"
                    onClick={toggleBookmarksPanel}
                  >
                    <Bookmark className="h-4 w-4 me-1" />
                    {tp("bookmarks")}
                    {bookmarks.length > 0 && (
                      <span className="ms-1 text-xs">
                        ({bookmarks.length})
                      </span>
                    )}
                  </Button>
                </div>

                {/* Bookmarks panel */}
                {showBookmarksPanel && (
                  <BookmarksPanel
                    bookmarks={bookmarks}
                    loading={bookmarksLoading}
                    currentTime={videoCurrentTime}
                    onAdd={addBookmark}
                    onUpdate={updateBookmark}
                    onDelete={deleteBookmark}
                    onSeekTo={(seconds) => {
                      if (seekToRef.current) seekToRef.current(seconds);
                    }}
                  />
                )}
              </>
            )}

            {currentLesson.content_type === "document" &&
              currentLesson.content_html && (
                <div
                  className="prose prose-brand max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{
                    __html: currentLesson.content_html,
                  }}
                />
              )}

            {currentLesson.content_type === "quiz" && course && (
              <QuizGate lessonId={lessonId} courseId={course.id} />
            )}
          </>
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
