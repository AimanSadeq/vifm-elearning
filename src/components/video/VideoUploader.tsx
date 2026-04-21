"use client";

import { useState, useRef } from "react";
import { Upload, FileVideo, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface VideoUploaderProps {
  lessonId: string;
  courseId: string;
  currentVideoUrl?: string | null;
  onUploadComplete: (url: string) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function detectVideoDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    const url = URL.createObjectURL(file);
    video.src = url;
    video.onloadedmetadata = () => {
      const duration =
        isFinite(video.duration) && video.duration > 0
          ? video.duration
          : null;
      URL.revokeObjectURL(url);
      resolve(duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
  });
}

export function VideoUploader({
  lessonId,
  courseId,
  currentVideoUrl,
  onUploadComplete,
}: VideoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: number;
    duration: number | null;
  } | null>(null);

  const handleUpload = async (file: File) => {
    setError(null);
    setIsUploading(true);
    setProgress(0);

    const allowedTypes = ["video/mp4", "video/webm", "video/quicktime"];
    if (!allowedTypes.includes(file.type)) {
      setError("Only MP4, WebM, and MOV files are allowed");
      setIsUploading(false);
      return;
    }

    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
    if (file.size > maxSize) {
      setError("File size must be under 2GB");
      setIsUploading(false);
      return;
    }

    // Detect duration client-side
    const duration = await detectVideoDuration(file);
    setSelectedFile({ name: file.name, size: file.size, duration });

    try {
      const { directUpload } = await import("@/lib/uploads/direct-upload");
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const ticket = await directUpload(courseId, "video", file, (pct) =>
        setProgress(pct)
      );

      const { error: updateError } = await supabase
        .from("lessons")
        .update({
          video_url: ticket.path,
          video_duration_seconds: duration ? Math.round(duration) : null,
        })
        .eq("id", lessonId);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setProgress(100);
      onUploadComplete(ticket.path);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      {currentVideoUrl && (
        <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
          <FileVideo className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate text-muted-foreground">
            {currentVideoUrl}
          </span>
        </div>
      )}

      {selectedFile && !isUploading && (
        <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
          <span className="font-medium">{selectedFile.name}</span>
          {" — "}
          {formatFileSize(selectedFile.size)}
          {selectedFile.duration !== null && (
            <> — {formatDuration(selectedFile.duration)}</>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-md bg-error/10 px-3 py-2 text-sm text-error">
          {error}
        </div>
      )}

      {isUploading ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading video... {progress}%
          </div>
          <Progress value={progress} />
        </div>
      ) : (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 me-1" />
            {currentVideoUrl ? "Replace Video" : "Upload Video"}
          </Button>
        </>
      )}
    </div>
  );
}
