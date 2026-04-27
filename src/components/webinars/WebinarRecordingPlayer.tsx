"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Loader2, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WebinarRecordingPlayerProps {
  webinarId: string;
  /**
   * Custom fetch URL — defaults to the public gated endpoint. The admin edit
   * page can pass `/api/admin/webinars/<id>/recording-url` (a future endpoint)
   * if it wants a different signing surface. Today the public endpoint also
   * works for super_admin via the bypass, so the default is fine.
   */
  fetchUrl?: string;
  /**
   * If false, the player won't auto-fetch on mount — useful when the parent
   * doesn't yet know whether the user has access. Defaults to true.
   */
  autoLoad?: boolean;
  /** Optional bearer token for admin paths that need explicit auth. */
  bearerToken?: string;
  posterUrl?: string | null;
  className?: string;
}

type PlayerState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; url: string }
  | { kind: "error"; message: string };

export function WebinarRecordingPlayer({
  webinarId,
  fetchUrl,
  autoLoad = true,
  bearerToken,
  posterUrl,
  className,
}: WebinarRecordingPlayerProps) {
  const t = useTranslations("webinars");
  const [state, setState] = useState<PlayerState>({ kind: "idle" });

  const endpoint = fetchUrl ?? `/api/webinars/${webinarId}/recording`;

  async function load() {
    setState({ kind: "loading" });
    try {
      const res = await fetch(endpoint, {
        headers: bearerToken ? { Authorization: `Bearer ${bearerToken}` } : undefined,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.data?.url) {
        throw new Error(json.error || t("playerError"));
      }
      setState({ kind: "ready", url: json.data.url });
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : t("playerNetworkError"),
      });
    }
  }

  useEffect(() => {
    if (!autoLoad) return;
    load();
    // We deliberately ignore endpoint changes mid-mount — webinarId is stable
    // for the page. If the parent ever wants a refresh, it can remount via key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webinarId, autoLoad]);

  if (state.kind === "loading") {
    return (
      <div
        className={`flex aspect-video w-full items-center justify-center rounded-lg border bg-muted/30 ${className ?? ""}`}
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("playerLoading")}
        </div>
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div
        className={`flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-lg border bg-muted/30 p-6 text-center ${className ?? ""}`}
      >
        <AlertCircle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
        <p className="text-sm text-muted-foreground">{state.message}</p>
        <Button type="button" variant="outline" size="sm" onClick={load}>
          {t("playerRetry")}
        </Button>
      </div>
    );
  }

  if (state.kind === "idle") {
    return (
      <div
        className={`flex aspect-video w-full items-center justify-center rounded-lg border bg-muted/30 ${className ?? ""}`}
      >
        <Button type="button" onClick={load} className="gap-2">
          <PlayCircle className="h-4 w-4" />
          {t("playerLoad")}
        </Button>
      </div>
    );
  }

  return (
    <video
      controls
      controlsList="nodownload"
      preload="metadata"
      poster={posterUrl ?? undefined}
      className={`w-full rounded-lg bg-black aspect-video ${className ?? ""}`}
    >
      {/* type hint helps Safari pick the right decoder; Supabase recordings
          are mp4 in this codebase. */}
      <source src={state.url} type="video/mp4" />
      {t("playerUnsupported")}
    </video>
  );
}
