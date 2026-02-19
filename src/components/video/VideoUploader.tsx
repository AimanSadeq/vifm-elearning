"use client";

import { useState, useRef } from "react";
import { Upload, FileVideo, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/client";

interface VideoUploaderProps {
  lessonId: string;
  currentVideoUrl?: string | null;
  onUploadComplete: (url: string) => void;
}

export function VideoUploader({
  lessonId,
  currentVideoUrl,
  onUploadComplete,
}: VideoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

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

    const supabase = createClient();
    const filePath = `lessons/${lessonId}/${Date.now()}-${file.name}`;

    // Simulate progress since Supabase doesn't provide upload progress natively
    const progressTimer = setInterval(() => {
      setProgress((prev) => Math.min(prev + 5, 90));
    }, 500);

    const { error: uploadError } = await supabase.storage
      .from("videos")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    clearInterval(progressTimer);

    if (uploadError) {
      setError(uploadError.message);
      setIsUploading(false);
      return;
    }

    setProgress(100);

    // Update lesson with video path
    await supabase
      .from("lessons")
      .update({ video_url: filePath })
      .eq("id", lessonId);

    onUploadComplete(filePath);
    setIsUploading(false);
  };

  return (
    <div className="space-y-3">
      {currentVideoUrl && (
        <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
          <FileVideo className="h-4 w-4 text-muted-foreground" />
          <span className="flex-1 truncate text-muted-foreground">
            {currentVideoUrl}
          </span>
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
