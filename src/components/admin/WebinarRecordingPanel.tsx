"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, Trash2, Video } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WebinarRecordingPanelProps {
  webinarId: string;
}

interface RecordingState {
  status: string;
  url: string;
  isPublic: boolean;
  hasExisting: boolean;
}

export function WebinarRecordingPanel({ webinarId }: WebinarRecordingPanelProps) {
  const [state, setState] = useState<RecordingState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
      if (!res.ok) {
        throw new Error(json.error || "Could not load recording");
      }
      setState({
        status: json.data.status ?? "scheduled",
        url: json.data.recording?.url ?? "",
        isPublic: json.data.recording?.is_public ?? false,
        hasExisting: Boolean(json.data.recording),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load recording");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
    // Re-load on webinarId change (rare but safe).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webinarId]);

  async function handleSave() {
    if (!state) return;
    if (!state.url.trim()) {
      toast.error("Enter a recording URL first.");
      return;
    }

    setIsSaving(true);
    const token = await getToken();
    if (!token) {
      setIsSaving(false);
      toast.error("Sign in again to save.");
      return;
    }
    try {
      const res = await fetch(`/api/admin/webinars/${webinarId}/recording`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          url: state.url.trim(),
          is_public: state.isPublic,
          mark_completed: true,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || "Save failed");
      }
      if (json.warning) {
        toast.warning(json.warning);
      } else {
        toast.success("Recording saved. Webinar marked completed.");
      }
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
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
      if (!res.ok) {
        throw new Error(json.error || "Delete failed");
      }
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
                  (saving a recording will mark this as completed)
                </span>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="recording_url">Recording URL</Label>
              <Input
                id="recording_url"
                type="url"
                placeholder="https://zoom.us/rec/share/... or YouTube / Vimeo / S3 link"
                value={state.url}
                onChange={(e) =>
                  setState({ ...state, url: e.target.value })
                }
                disabled={isSaving || isDeleting}
              />
              <p className="text-xs text-muted-foreground">
                Paste any direct link the learner&apos;s browser can open. The URL
                is stored in a separately-RLS&apos;d table — only super-admins (and
                this admin UI) can read it; the public webinar row never exposes
                it.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="recording_is_public"
                type="checkbox"
                checked={state.isPublic}
                onChange={(e) =>
                  setState({ ...state, isPublic: e.target.checked })
                }
                disabled={isSaving || isDeleting}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="recording_is_public" className="text-sm">
                Show &quot;recording available&quot; badge on the public webinar
                catalog (URL itself stays gated by plan/role)
              </Label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <div className="text-xs text-muted-foreground">
                {state.hasExisting ? "A recording is already linked." : "No recording yet."}
              </div>
              <div className="flex gap-2">
                {state.hasExisting && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDelete}
                    disabled={isSaving || isDeleting}
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
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || isDeleting || !state.url.trim()}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="h-4 w-4 me-1" />
                      Save recording
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
