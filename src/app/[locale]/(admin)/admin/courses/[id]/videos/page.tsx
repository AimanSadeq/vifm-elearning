"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  ArrowLeft,
  Upload,
  Link2,
  CheckCircle2,
  XCircle,
  Loader2,
  Video,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { cn } from "@/lib/utils/cn";
import { toast, Toaster } from "sonner";
import type { Module, Lesson, Course } from "@/types";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ModuleWithLessons extends Module {
  lessons: Lesson[];
}

/* ------------------------------------------------------------------ */
/*  Lesson Row                                                         */
/* ------------------------------------------------------------------ */

function LessonRow({
  lesson,
  courseId,
  onVideoUpdated,
}: {
  lesson: Lesson;
  courseId: string;
  onVideoUpdated: () => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [externalUrl, setExternalUrl] = useState("");
  const [isSavingUrl, setIsSavingUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasVideo = !!lesson.video_url;
  const isExternal =
    lesson.video_url?.startsWith("http://") ||
    lesson.video_url?.startsWith("https://");

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        toast.error("Authentication required");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("courseId", courseId);
      formData.append("lessonId", lesson.id);

      // Get video duration from file
      const duration = await getVideoDuration(file);
      if (duration) {
        formData.append("duration", String(Math.round(duration)));
      }

      const res = await fetch("/api/video/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }

      toast.success(`Video uploaded for "${lesson.title}"`);
      onVideoUpdated();
    } catch (err) {
      toast.error(
        `Upload failed: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSaveUrl = async () => {
    if (!externalUrl.trim()) return;

    setIsSavingUrl(true);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        toast.error("Authentication required");
        return;
      }

      const res = await fetch(`/api/admin/lessons/${lesson.id}/video-url`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ video_url: externalUrl.trim() }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save URL");
      }

      toast.success(`URL saved for "${lesson.title}"`);
      setShowUrlInput(false);
      setExternalUrl("");
      onVideoUpdated();
    } catch (err) {
      toast.error(
        `Failed: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setIsSavingUrl(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 border-b py-3 last:border-b-0 sm:flex-row sm:items-center sm:gap-4">
      {/* Lesson info */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Video className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{lesson.title}</p>
          {lesson.title_ar && (
            <p className="truncate text-xs text-muted-foreground" dir="rtl">
              {lesson.title_ar}
            </p>
          )}
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {lesson.duration_minutes} min
        </span>
      </div>

      {/* Status + actions */}
      <div className="flex items-center gap-2">
        {/* Status badge */}
        {hasVideo ? (
          <Badge variant="success" className="shrink-0 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {isExternal ? "External" : "Uploaded"}
          </Badge>
        ) : (
          <Badge variant="secondary" className="shrink-0 gap-1">
            <XCircle className="h-3 w-3" />
            No Video
          </Badge>
        )}

        {/* Upload button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
            e.target.value = "";
          }}
        />
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          {isUploading ? "Uploading..." : "Upload"}
        </Button>

        {/* External URL button */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5"
          onClick={() => setShowUrlInput(!showUrlInput)}
        >
          <Link2 className="h-3.5 w-3.5" />
          URL
        </Button>
      </div>

      {/* External URL input (expandable) */}
      {showUrlInput && (
        <div className="flex w-full items-center gap-2 ps-11">
          <input
            type="url"
            placeholder="https://example.com/video.mp4"
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            className="h-8 flex-1 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button
            size="sm"
            className="h-8"
            disabled={isSavingUrl || !externalUrl.trim()}
            onClick={handleSaveUrl}
          >
            {isSavingUrl ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              "Save"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Module Group                                                       */
/* ------------------------------------------------------------------ */

function ModuleGroup({
  module: mod,
  index,
  courseId,
  onVideoUpdated,
}: {
  module: ModuleWithLessons;
  index: number;
  courseId: string;
  onVideoUpdated: () => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const videoLessons = mod.lessons.filter((l) => l.content_type === "video");
  const uploadedCount = videoLessons.filter((l) => !!l.video_url).length;

  return (
    <Card>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-3 p-4 text-start transition-colors hover:bg-muted/30"
      >
        {isOpen ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50">
          <span className="text-sm font-bold text-brand-600">{index + 1}</span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-sm font-semibold">{mod.title}</h3>
          {mod.title_ar && (
            <p className="text-xs text-muted-foreground" dir="rtl">
              {mod.title_ar}
            </p>
          )}
        </div>
        <Badge
          variant={
            uploadedCount === videoLessons.length && videoLessons.length > 0
              ? "success"
              : "secondary"
          }
          className="shrink-0"
        >
          {uploadedCount}/{videoLessons.length} videos
        </Badge>
      </button>

      {isOpen && videoLessons.length > 0 && (
        <CardContent className="border-t pt-2">
          {videoLessons.map((lesson) => (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              courseId={courseId}
              onVideoUpdated={onVideoUpdated}
            />
          ))}
        </CardContent>
      )}

      {isOpen && videoLessons.length === 0 && (
        <CardContent className="border-t">
          <p className="py-4 text-center text-sm text-muted-foreground">
            No video lessons in this module
          </p>
        </CardContent>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Helper: Get video duration from file                               */
/* ------------------------------------------------------------------ */

function getVideoDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      resolve(null);
    };

    video.src = URL.createObjectURL(file);
  });
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function BulkVideosPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<ModuleWithLessons[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScaffolding, setIsScaffolding] = useState(false);

  const fetchData = async () => {
    const supabase = createClient();

    const [{ data: courseData }, { data: modulesData }] = await Promise.all([
      supabase.from("courses").select("*").eq("id", courseId).single(),
      supabase
        .from("modules")
        .select("*, lessons(*)")
        .eq("course_id", courseId)
        .order("sort_order", { ascending: true }),
    ]);

    if (courseData) {
      setCourse(courseData as Course);
    }

    if (modulesData) {
      const sorted = modulesData.map((m: ModuleWithLessons) => ({
        ...m,
        lessons: (m.lessons || []).sort(
          (a: Lesson, b: Lesson) => a.sort_order - b.sort_order
        ),
      })) as ModuleWithLessons[];
      setModules(sorted);
    }

    setIsLoading(false);
  };

  const handleScaffold = async () => {
    if (!course) return;
    setIsScaffolding(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error("Authentication required");
        return;
      }

      // Find the designation slug from the course
      let slug: string | null = null;
      if (course.designation_id) {
        const { data: desig } = await supabase
          .from("designations")
          .select("slug")
          .eq("id", course.designation_id)
          .single();
        slug = desig?.slug ?? null;
      }

      // Fall back to extracting slug from course slug (e.g., "cdip-course" → "cdip")
      if (!slug && course.slug) {
        slug = course.slug.replace(/-course$/, "");
      }

      if (!slug) {
        toast.error("Could not determine designation slug");
        return;
      }

      const res = await fetch(`/api/admin/courses/${courseId}/scaffold`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ slug }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Scaffold failed");
        return;
      }

      if (result.skipped) {
        toast.info("Modules already exist — nothing to scaffold");
      } else {
        toast.success(
          `Created ${result.modulesCreated} modules and ${result.lessonsCreated} lessons`
        );
      }

      // Refresh data
      await fetchData();
    } catch (err) {
      toast.error("Scaffold failed");
      console.error(err);
    } finally {
      setIsScaffolding(false);
    }
  };

  useEffect(() => {
    if (courseId) fetchData();
  }, [courseId]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Course not found.</p>
      </div>
    );
  }

  const totalLessons = modules.reduce(
    (sum, m) => sum + m.lessons.filter((l) => l.content_type === "video").length,
    0
  );
  const uploadedLessons = modules.reduce(
    (sum, m) =>
      sum +
      m.lessons.filter((l) => l.content_type === "video" && !!l.video_url)
        .length,
    0
  );

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              router.push(`/${locale}/admin/courses/${courseId}/edit`)
            }
          >
            <ArrowLeft className="h-4 w-4 me-1" />
            Back to Editor
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold">
              Manage Videos
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {course.title}
            </p>
          </div>
          <Badge
            variant={uploadedLessons === totalLessons && totalLessons > 0 ? "success" : "secondary"}
            className="text-sm"
          >
            {uploadedLessons}/{totalLessons} videos ready
          </Badge>
        </div>

        {/* Progress bar */}
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-brand-600 transition-all duration-500"
            style={{
              width: totalLessons > 0
                ? `${(uploadedLessons / totalLessons) * 100}%`
                : "0%",
            }}
          />
        </div>

        {/* Modules */}
        <div className="space-y-3">
          {modules.map((mod, i) => (
            <ModuleGroup
              key={mod.id}
              module={mod}
              index={i}
              courseId={courseId}
              onVideoUpdated={fetchData}
            />
          ))}
        </div>

        {modules.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Video className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 font-semibold">No modules found</h3>
              {course.designation_id ? (
                <>
                  <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                    This course is linked to a certification. You can auto-generate modules and lessons from the course content registry.
                  </p>
                  <Button
                    className="mt-4 gap-2"
                    onClick={handleScaffold}
                    disabled={isScaffolding}
                  >
                    {isScaffolding ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {isScaffolding ? "Generating..." : "Generate Modules & Lessons"}
                  </Button>
                </>
              ) : (
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  This course has no modules yet. Go back to the course editor to add modules and lessons first, then return here to upload videos.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
