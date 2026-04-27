"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  Save,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { uploadWebinarRecording } from "@/lib/uploads/direct-upload";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WebinarRecordingPanelProps {
  webinarId: string;
}

interface RecordingState {
  status: string;
  storedPath: string;
  isPublic: boolean;
  hasExisting: boolean;
}

const ACCEPTED_TYPES = "video/mp4,video/webm,video/quicktime";
const MAX_BYTES = 2 * 1024 * 1024 * 1024;

export function WebinarRecordingPanel({ webinarId }: WebinarRecordingPanelProps) {
  const [state, setState] = useState<RecordingState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function getToken(): Promise<string | null> {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }

  async function load() {
    setIsLoading(true);
    const token = await getToken();
    if (!token) {
      toast.error("Sign in again to manage recordings.");
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/admin/webinars/${webinarId}/recording`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not load recording");
      setState({
        status: json.data.status ?? "scheduled",
        storedPath: json.data.recording?.url ?? "",
        isPublic: json.data.recording?.is_public ?? false,
        hasExisting: Boolean(json.data.recording?.url),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load recording");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webinarId]);

  function handlePickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (file.size > MAX_BYTES) {
      toast.error("File is too large. Max 2 GB.");
      return;
    }
    if (!ACCEPTED_TYPES.split(",").includes(file.type)) {
      toast.error("Use an MP4, WebM, or MOV file.");
      return;
    }
    setPendingFile(file);
  }

  async function handleUpload() {
    if (!state || !pendingFile) return;
    const token = await getToken();
    if (!token) {
      toast.error("Sign in again to upload.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    try {
      const ticket = await uploadWebinarRecording(
        webinarId,
        pendingFile,
        token,
        (pct) => setUploadProgress(pct)
      );

      // After the file lands in Storage, link it to the webinar via PUT.
      // mark_completed flips the webinar status so the public page actually
      // serves the recording.
      const res = await fetch(`/api/admin/webinars/${webinarId}/recording`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          path: ticket.path,
          is_public: state.isPublic,
          mark_completed: true,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Could not save recording");
      if (json.warning) toast.warning(json.warning);
      else toast.success("Recording uploaded. Webinar marked completed.");

      setPendingFile(null);
      setUploadProgress(100);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleVisibilitySave(nextValue: boolean) {
    if (!state || !state.hasExisting) return;
    const token = await getToken();
    if (!token) {
      toast.error("Sign in again to save.");
      return;
    }
    const res = await fetch(`/api/admin/webinars/${webinarId}/recording`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        path: state.storedPath,
        is_public: nextValue,
        mark_completed: false, // Don't flip status when only toggling visibility.
      }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      toast.error(json.error || "Could not update visibility");
      return;
    }
    setState({ ...state, isPublic: nextValue });
  }

  async function handleDelete() {
    if (!state?.hasExisting) return;
    if (!confirm("Remove this recording? Learners will lose access to it.")) return;

    setIsDeleting(true);
    const token = await getToken();
    if (!token) {
      setIsDeleting(false);
      toast.error("Sign in again to delete.");
      return;
    }
    try {
      const res = await fetch(`/api/admin/webinars/${webinarId}/recording`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Delete failed");
      toast.success("Recording removed");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Video className="h-5 w-5" />
          Recording
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading || !state ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : (
          <>
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Webinar status:</span>{" "}
              {state.status}
              {state.status !== "completed" && (
                <span className="ms-2 text-amber-700 dark:text-amber-400">
                  (uploading a recording will mark this as completed)
                </span>
              )}
            </div>

            {/* Existing recording state */}
            {state.hasExisting && !pendingFile && !isUploading && (
              <div className="flex items-start gap-3 rounded-md border bg-emerald-50 dark:bg-emerald-950/30 p-3">
                <CheckCircle2 className="h-5 w-5 mt-0.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Recording uploaded</p>
                  <p className="text-xs text-muted-foreground truncate" title={state.storedPath}>
                    {state.storedPath}
                  </p>
                </div>
              </div>
            )}

            {/* File picker / pending file */}
            <div className="space-y-2">
              <Label>{state.hasExisting ? "Replace recording" : "Upload recording"}</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES}
                onChange={handlePickFile}
                disabled={isUploading || isDeleting}
                className="hidden"
              />

              {!pendingFile && !isUploading && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isDeleting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-6 text-sm font-medium text-muted-foreground hover:bg-muted/40 transition-colors disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  Click to select a video (MP4 / WebM / MOV, up to 2 GB)
                </button>
              )}

              {pendingFile && !isUploading && (
                <div className="flex items-center gap-3 rounded-md border bg-card px-3 py-2">
                  <Video className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{pendingFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(pendingFile.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPendingFile(null)}
                    className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    title="Remove"
                    aria-label="Remove selected file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    Uploading… {uploadProgress}%
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                id="recording_is_public"
                type="checkbox"
                checked={state.isPublic}
                onChange={(e) => handleVisibilitySave(e.target.checked)}
                disabled={isUploading || isDeleting || !state.hasExisting}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="recording_is_public" className="text-sm">
                Show &quot;recording available&quot; badge on the public webinar
                catalog (URL itself stays gated by plan/role)
              </Label>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              {state.hasExisting && !pendingFile && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDelete}
                  disabled={isUploading || isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 me-1" />
                      Remove
                    </>
                  )}
                </Button>
              )}
              {pendingFile && (
                <Button
                  type="button"
                  onClick={handleUpload}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="h-4 w-4 me-1" />
                      {state.hasExisting ? "Replace recording" : "Upload recording"}
                    </>
                  )}
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
