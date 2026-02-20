"use client";

import { Clock, BarChart2, Eye } from "lucide-react";
import { useTranslations } from "next-intl";

interface WatchStatsBadgeProps {
  watchTimeSeconds: number;
  completionPercent: number;
  viewCount: number;
}

function formatWatchTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hours}h ${remainMins}m`;
}

export function WatchStatsBadge({
  watchTimeSeconds,
  completionPercent,
  viewCount,
}: WatchStatsBadgeProps) {
  const t = useTranslations("player");

  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1" title={t("watchTime")}>
        <Clock className="h-3.5 w-3.5" />
        {formatWatchTime(watchTimeSeconds)}
      </span>
      <span
        className="inline-flex items-center gap-1"
        title={t("completionPercent")}
      >
        <BarChart2 className="h-3.5 w-3.5" />
        {Math.round(completionPercent)}%
      </span>
      <span className="inline-flex items-center gap-1" title={t("views")}>
        <Eye className="h-3.5 w-3.5" />
        {viewCount}
      </span>
    </div>
  );
}
