"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Loader2, ExternalLink, Sparkles, FileText, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Lesson } from "@/types";

interface LessonPreviewDialogProps {
  lesson: Lesson | null;
  courseSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Click-to-preview dialog for a single lesson marked `is_preview = true`.
 *
 * - Video lessons: hits /api/video/signed-url (server-side already allows
 *   previews without enrollment) and renders the resolved URL in a <video>.
 * - Document lessons: resolves the document_url against Supabase storage
 *   (mirroring the in-course viewer) and embeds it in an iframe / shows a
 *   download card for ZIPs.
 *
 * Always shows an "Enroll / Subscribe" CTA so previewers can complete the
 * funnel from inside the modal.
 */
export function LessonPreviewDialog({
  lesson,
  courseSlug,
  open,
  onOpenChange,
}: LessonPreviewDialogProps) {
  const locale = useLocale();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !lesson || lesson.content_type !== "video") {
      setVideoUrl(null);
      return;
    }
    let cancelled = false;
    setIsResolving(true);
    setError(null);
    fetch("/api/video/signed-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId: lesson.id }),
    })
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (j.url) setVideoUrl(j.url);
        else setError(j.error ?? "Could not load preview");
      })
      .catch(() => {
        if (!cancelled)
          setError(
            locale === "ar" ? "فشل تحميل المعاينة" : "Could not load preview"
          );
      })
      .finally(() => {
        if (!cancelled) setIsResolving(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, lesson, locale]);

  if (!lesson) return null;

  const title =
    locale === "ar"
      ? lesson.title_ar || lesson.title || ""
      : lesson.title || lesson.title_ar || "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 text-brand-700 px-2 py-0.5 text-[10px] font-semibold">
              <Sparkles className="h-3 w-3" />
              {locale === "ar" ? "معاينة مجانية" : "Free Preview"}
            </span>
            <span className="truncate">{title}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Body */}
        <div className="space-y-4">
          {lesson.content_type === "video" && (
            <div className="aspect-video overflow-hidden rounded-lg bg-black">
              {isResolving ? (
                <div className="flex h-full items-center justify-center text-white/70">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : error ? (
                <div className="flex h-full items-center justify-center p-6 text-center text-sm text-white/70">
                  {error}
                </div>
              ) : videoUrl ? (
                <video
                  src={videoUrl}
                  className="h-full w-full"
                  controls
                  controlsList="nodownload"
                  autoPlay
                />
              ) : (
                <div className="flex h-full items-center justify-center text-white/60">
                  {locale === "ar" ? "لا يوجد فيديو" : "No video available"}
                </div>
              )}
            </div>
          )}

          {lesson.content_type === "document" && lesson.document_url && (
            <DocumentPreview lesson={lesson} />
          )}

          {lesson.content_type !== "video" &&
            lesson.content_type !== "document" && (
              <div className="rounded-lg border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                {locale === "ar"
                  ? "هذا الدرس غير قابل للمعاينة في النافذة المنبثقة."
                  : "This lesson type isn't previewable here."}
              </div>
            )}

          {/* Upgrade CTA */}
          <div className="rounded-lg border bg-gradient-to-br from-brand-50 to-amber-50/50 p-4 dark:from-brand-950/30 dark:to-amber-950/20">
            <p className="text-sm font-semibold">
              {locale === "ar"
                ? "هل تريد الوصول إلى الدورة الكاملة؟"
                : "Want to unlock the rest?"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {locale === "ar"
                ? "اشترك للوصول إلى جميع الدروس والشهادات والمزيد."
                : "Subscribe or enroll to access every lesson, certificates, and more."}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Link href={`/${locale}/pricing`}>
                <Button size="sm">
                  <Sparkles className="h-3.5 w-3.5 me-1.5" />
                  {locale === "ar" ? "عرض الأسعار" : "View plans"}
                </Button>
              </Link>
              <Link href={`/${locale}/courses/${courseSlug}/checkout`}>
                <Button size="sm" variant="outline">
                  {locale === "ar"
                    ? "شراء هذه الدورة"
                    : "Buy this course"}
                  <ArrowRight className="h-3.5 w-3.5 ms-1.5 rtl:rotate-180" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DocumentPreview({ lesson }: { lesson: Lesson }) {
  const locale = useLocale();
  const raw = lesson.document_url ?? "";
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const resolved = raw.startsWith("http")
    ? raw
    : `${base}/storage/v1/object/public/course-assets/${raw}`;

  const docType = (lesson.document_type ?? "").toLowerCase();
  const ext = raw.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  const isZip = docType === "zip" || ext === "zip";
  const isOffice =
    docType === "word" ||
    docType === "excel" ||
    ["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(ext);

  const fileName =
    (lesson.metadata as { file_name?: string } | null)?.file_name ??
    raw.split("/").pop() ??
    "download";

  if (isZip) {
    return (
      <div className="rounded-lg border bg-card p-6 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <FileText className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{fileName}</p>
          <p className="text-xs text-muted-foreground">
            {locale === "ar"
              ? "ملف مضغوط — قم بالتنزيل"
              : "ZIP archive — download to view"}
          </p>
        </div>
        <a
          href={resolved}
          download={fileName}
          className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {locale === "ar" ? "تنزيل" : "Download"}
        </a>
      </div>
    );
  }

  const iframeSrc = isOffice
    ? `https://docs.google.com/gview?url=${encodeURIComponent(resolved)}&embedded=true`
    : resolved;

  return (
    <iframe
      src={iframeSrc}
      className="h-[60vh] w-full rounded-lg border"
      title="Document preview"
    />
  );
}
