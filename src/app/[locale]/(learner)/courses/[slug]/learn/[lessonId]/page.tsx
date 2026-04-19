"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Globe, ExternalLink, MessageSquare, Bookmark, Lock, Play, CheckCircle } from "lucide-react";
import DOMPurify from "dompurify";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { useSequentialLocking } from "@/lib/hooks/useSequentialLocking";
import { useVideoBookmarks } from "@/lib/hooks/useVideoBookmarks";
import { useWatchStatistics } from "@/lib/hooks/useWatchStatistics";
import { useWatchedSegments } from "@/lib/hooks/useWatchedSegments";
import { CoursePlayer } from "@/components/courses/CoursePlayer";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { useVideoProgress } from "@/components/video/VideoProgress";
import { BookmarksPanel } from "@/components/video/BookmarksPanel";
import { WatchStatsBadge } from "@/components/video/WatchStatsBadge";
import { QuizGate } from "@/components/quizzes/QuizGate";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ThreadList } from "@/components/forums/ThreadList";
import { useCoursePlayerStore } from "@/stores/course-player-store";
import { createTimeValidator } from "@/lib/utils/devtools-detection";
import { sendBeaconProgress } from "@/lib/utils/progress-queue";
import type { Course, Module, Lesson, LessonProgress, VideoConfig } from "@/types";

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
  const [showLockAlert, setShowLockAlert] = useState(false);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [videoConfig, setVideoConfig] = useState<VideoConfig | null>(null);
  const [markingComplete, setMarkingComplete] = useState(false);
  const [designationSlug, setDesignationSlug] = useState<string | null>(null);
  const [signedVideoUrl, setSignedVideoUrl] = useState<string | null>(null);

  const seekToRef = useRef<((seconds: number) => void) | null>(null);
  const timeValidatorRef = useRef(createTimeValidator());
  const isNewSessionRef = useRef(true);

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

  // Video duration for segments
  const videoDuration = currentLesson?.video_duration_seconds ?? 0;

  // Watched segments hook
  const {
    markSegment,
    getCompletionPercentage,
    mergeSegments,
    getSegments,
  } = useWatchedSegments({ duration: videoDuration });

  // Video progress hook
  const { saveProgress: baseSaveProgress, markComplete } = useVideoProgress({
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

  // Watch statistics
  const { trackPlay, trackPause, trackSeek, getStats } = useWatchStatistics({
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

  // Fetch video config on mount
  useEffect(() => {
    if (!lessonId) return;
    async function fetchConfig() {
      try {
        const res = await fetch(`/api/video/config?lessonId=${lessonId}`);
        if (res.ok) {
          const data = await res.json();
          setVideoConfig(data);
        }
      } catch {
        // Config fetch failed — use defaults
      }
    }
    fetchConfig();
  }, [lessonId]);

  // Fetch signed video URL when lesson changes
  useEffect(() => {
    if (!lessonId) return;
    setSignedVideoUrl(null);
    async function fetchSignedUrl() {
      try {
        const res = await fetch("/api/video/signed-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lessonId }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.url) setSignedVideoUrl(data.url);
        }
      } catch {
        // Signed URL fetch failed — video will not play
      }
    }
    fetchSignedUrl();
  }, [lessonId]);

  // Load existing progress including watched segments
  const userId = user?.id;
  useEffect(() => {
    if (!userId || !lessonId) return;
    async function loadProgress() {
      try {
        const res = await fetch(
          `/api/video/progress?lessonId=${lessonId}&userId=${userId}`
        );
        if (res.ok) {
          const { progress } = await res.json();
          if (progress?.watched_segments && Array.isArray(progress.watched_segments)) {
            mergeSegments(progress.watched_segments);
          }
        }
      } catch {
        // Silent fail
      }
    }
    loadProgress();
  }, [userId, lessonId, mergeSegments]);

  // Enhanced save progress that includes new fields
  const saveProgress = useCallback(
    async (currentTime: number, duration: number) => {
      if (!user?.id || !lessonId || !course?.id) return;

      const segmentCompletion = getCompletionPercentage();
      const threshold = videoConfig?.minimumWatchPercentage ?? 90;
      const isCompleted = segmentCompletion >= threshold;

      // Get time delta from validator
      const { elapsedMs } = timeValidatorRef.current.stop();
      const delta = elapsedMs / 1000;
      timeValidatorRef.current.start();

      // Validate time (warn-only)
      timeValidatorRef.current.validate(delta);

      const payload = {
        userId: user.id,
        lessonId,
        courseId: course.id,
        progressSeconds: Math.floor(currentTime),
        isCompleted,
        progressPercentage: Math.round(segmentCompletion),
        videoCompleted: isCompleted,
        totalWatchTimeDelta: delta,
        isNewSession: isNewSessionRef.current,
        watchedSegments: getSegments(),
      };

      // After first save, no longer a new session
      isNewSessionRef.current = false;

      try {
        const res = await fetch("/api/video/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          // Fall back to base save
          await baseSaveProgress(currentTime, duration);
        }
      } catch {
        await baseSaveProgress(currentTime, duration);
      }
    },
    [user?.id, lessonId, course?.id, getCompletionPercentage, getSegments, videoConfig?.minimumWatchPercentage, baseSaveProgress]
  );

  // Consolidated beforeunload handler (single handler instead of duplicates)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!user?.id || !lessonId || !course?.id) return;

      sendBeaconProgress({
        userId: user.id,
        lessonId,
        courseId: course.id,
        progressSeconds: Math.floor(videoCurrentTime),
        watchedSegments: getSegments(),
        isNewSession: false,
      });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [user?.id, lessonId, course?.id, videoCurrentTime, getSegments]);

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

      // Fetch designation slug if course is linked to a designation
      if (courseData.designation_id) {
        const { data: desig } = await supabase
          .from("designations")
          .select("slug")
          .eq("id", courseData.designation_id)
          .eq("is_active", true)
          .single();
        if (desig) setDesignationSlug(desig.slug);
      }

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

  // Start time validator when playing
  const handlePlay = useCallback(() => {
    trackPlay();
    timeValidatorRef.current.start();
  }, [trackPlay]);

  const handlePause = useCallback(() => {
    trackPause();
    timeValidatorRef.current.stop();
  }, [trackPause]);

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
  const segmentCompletion = getCompletionPercentage();

  return (
    <CoursePlayer
      course={course}
      modules={modules}
      currentLessonId={lessonId}
      progressMap={progressMap}
      overallProgress={overallProgress}
      lockedLessonIds={lockedLessonIds}
      designationSlug={designationSlug}
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

                {signedVideoUrl ? (
                  <VideoPlayer
                    src={signedVideoUrl}
                    hlsSrc={currentLesson.video_hls_url}
                    poster={currentLesson.video_thumbnail_url}
                    initialTime={initialTime}
                    onProgress={saveProgress}
                    onComplete={markComplete}
                    captionsEnUrl={currentLesson.captions_en_url}
                    captionsArUrl={currentLesson.captions_ar_url}
                    bookmarks={bookmarks}
                    onSeekTo={seekToRef}
                    restrictSpeed={!(videoConfig?.allowSpeedControl ?? true)}
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
                    watchedSegments={getSegments()}
                    onSegmentUpdate={markSegment}
                    allowSkipping={videoConfig?.allowSkipping ?? true}
                    isFirstWatch={videoConfig?.isFirstWatch ?? false}
                    minimumWatchPercentage={videoConfig?.minimumWatchPercentage}
                    autoSaveIntervalSeconds={videoConfig?.autoSaveIntervalSeconds}
                    onPlay={handlePlay}
                    onPause={handlePause}
                    onSeek={trackSeek}
                  />
                ) : (
                  <div className="aspect-video flex items-center justify-center rounded-lg bg-black">
                    <LoadingSpinner />
                  </div>
                )}

                {/* Stats and bookmarks toggle row */}
                <div className="flex items-center justify-between">
                  <WatchStatsBadge
                    watchTimeSeconds={
                      existingProgress?.total_watch_time_seconds ??
                      stats.totalWatchTime
                    }
                    completionPercent={Math.round(segmentCompletion)}
                    viewCount={
                      existingProgress?.view_count ?? stats.playCount
                    }
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

            {currentLesson.content_type === "document" && (
              <div className="space-y-4">
                {/* PDF viewer */}
                {currentLesson.document_url && (
                  <div className="space-y-2">
                    <iframe
                      src={
                        currentLesson.document_url.startsWith("http")
                          ? `https://docs.google.com/gview?url=${encodeURIComponent(currentLesson.document_url)}&embedded=true`
                          : currentLesson.document_url
                      }
                      className="w-full rounded-lg border"
                      style={{ minHeight: "70vh" }}
                      title={tp("documentViewer")}
                    />
                    <div className="flex justify-end">
                      <a
                        href={currentLesson.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {tp("openInNewTab")} ↗
                      </a>
                    </div>
                  </div>
                )}

                {/* HTML content */}
                {currentLesson.content_html && (
                  <div
                    className="prose prose-brand max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(currentLesson.content_html, {
                        ALLOWED_TAGS: [
                          "p",
                          "br",
                          "strong",
                          "em",
                          "u",
                          "b",
                          "i",
                          "a",
                          "ul",
                          "ol",
                          "li",
                          "h1",
                          "h2",
                          "h3",
                          "h4",
                          "h5",
                          "h6",
                          "blockquote",
                          "code",
                          "pre",
                          "span",
                          "div",
                          "img",
                          "table",
                          "thead",
                          "tbody",
                          "tr",
                          "td",
                          "th",
                        ],
                        ALLOWED_ATTR: ["href", "target", "rel", "src", "alt", "title", "class"],
                        ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))/i,
                        FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "svg", "math"],
                        FORBID_ATTR: [
                          "onerror",
                          "onload",
                          "onclick",
                          "onmouseover",
                          "onfocus",
                          "onblur",
                          "onchange",
                          "onsubmit",
                          "formaction",
                        ],
                      }),
                    }}
                  />
                )}

                {/* Empty state */}
                {!currentLesson.document_url && !currentLesson.content_html && (
                  <div className="flex min-h-[30vh] items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/50">
                    <p className="text-muted-foreground">{tp("noContent")}</p>
                  </div>
                )}

                {/* Mark as Complete button */}
                {!progressMap[lessonId]?.is_completed && (
                  <div className="flex justify-center pt-2">
                    <Button
                      size="lg"
                      disabled={markingComplete}
                      onClick={async () => {
                        if (!course) return;
                        setMarkingComplete(true);
                        try {
                          const res = await fetch(
                            `/api/lessons/${lessonId}/complete`,
                            {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ courseId: course.id }),
                            }
                          );
                          if (res.ok) {
                            setProgressMap((prev) => ({
                              ...prev,
                              [lessonId]: {
                                ...prev[lessonId],
                                is_completed: true,
                                completed_at: new Date().toISOString(),
                              } as LessonProgress,
                            }));
                          }
                        } finally {
                          setMarkingComplete(false);
                        }
                      }}
                    >
                      <CheckCircle className="h-4 w-4 me-2" />
                      {markingComplete ? tp("markingComplete") : tp("markComplete")}
                    </Button>
                  </div>
                )}

                {progressMap[lessonId]?.is_completed && (
                  <div className="flex justify-center pt-2">
                    <Badge variant="success" className="text-sm py-1 px-3">
                      <CheckCircle className="h-4 w-4 me-1" />
                      {tp("completed")}
                    </Badge>
                  </div>
                )}
              </div>
            )}

            {currentLesson.content_type === "quiz" && course && (
              <QuizGate lessonId={lessonId} courseId={course.id} />
            )}
          </>
        )}

        {/* Course Website link (inline for quick access) */}
        {designationSlug && (
          <Link
            href={`/${locale}/designations/${designationSlug}?tab=courseWebsite`}
            className="flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 transition-colors hover:bg-brand-100 dark:border-brand-900 dark:bg-brand-950/30 dark:hover:bg-brand-950/50"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-900/50">
              <Globe className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">
                {tp("courseWebsite")}
              </p>
              <p className="text-xs text-brand-500 dark:text-brand-400/70">
                {tp("courseWebsiteDesc")}
              </p>
            </div>
            <ExternalLink className="h-4 w-4 shrink-0 text-brand-400" />
          </Link>
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
                {tp("previousLesson")}
              </Button>
            </Link>
          ) : (
            <div />
          )}

          {nextLesson ? (
            isLocked(nextLesson.id) ? (
              <Button size="sm" onClick={() => setShowLockAlert(true)}>
                {tp("nextLesson")}
                <Lock className="h-4 w-4 ms-1" />
              </Button>
            ) : (
              <Link
                href={`/${locale}/courses/${slug}/learn/${nextLesson.id}`}
              >
                <Button size="sm">
                  {tp("nextLesson")}
                  <ChevronRight className="h-4 w-4 ms-1 rtl:rotate-180" />
                </Button>
              </Link>
            )
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

      {/* Lock alert dialog */}
      <AlertDialog open={showLockAlert} onOpenChange={setShowLockAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {tp("lessonLocked")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {tp("completePrevious")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>
              {tp("ok")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CoursePlayer>
  );
}
