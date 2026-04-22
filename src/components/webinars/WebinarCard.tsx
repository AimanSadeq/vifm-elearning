"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import {
  Calendar,
  Clock,
  Play,
  Radio,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Video,
} from "lucide-react";
import { formatCurrency, formatDuration } from "@/lib/utils/formatters";
import type { Webinar } from "@/types";

interface WebinarCardProps {
  webinar: Webinar;
}

const MONTHS_SHORT_EN = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];
const MONTHS_SHORT_AR = [
  "ينا",
  "فبر",
  "مار",
  "أبر",
  "مايو",
  "يون",
  "يول",
  "أغس",
  "سبت",
  "أكت",
  "نوف",
  "ديس",
];

export function WebinarCard({ webinar }: WebinarCardProps) {
  const locale = useLocale();
  const t = useTranslations("webinars");

  const title =
    locale === "ar" && webinar.title_ar ? webinar.title_ar : webinar.title;
  const description =
    locale === "ar" && webinar.description_ar
      ? webinar.description_ar
      : webinar.description;
  const instructorName =
    (webinar.instructor as unknown as { full_name: string })?.full_name ?? "";

  const date = new Date(webinar.scheduled_at);
  const monthShort = (locale === "ar" ? MONTHS_SHORT_AR : MONTHS_SHORT_EN)[
    date.getMonth()
  ];
  const day = date.getDate();
  const timeStr = date.toLocaleTimeString(
    locale === "ar" ? "ar-AE" : "en-US",
    { hour: "numeric", minute: "2-digit" }
  );

  const isCompleted = webinar.status === "completed";
  const isLive = webinar.status === "live";
  const isScheduled = webinar.status === "scheduled";
  const isCancelled = webinar.status === "cancelled";

  const accent = isLive
    ? { bg: "bg-error/10", fg: "text-error", border: "border-error/20" }
    : isScheduled
    ? { bg: "bg-brand-100", fg: "text-brand-700", border: "border-brand-200" }
    : { bg: "bg-muted", fg: "text-muted-foreground", border: "border-border" };

  return (
    <Link
      href={`/${locale}/webinars/${webinar.id}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover hover:border-brand-200"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-brand-50 to-brand-100">
        {webinar.thumbnail_url ? (
          <Image
            src={webinar.thumbnail_url}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Video className="h-14 w-14 text-brand-300" />
          </div>
        )}

        {/* Top gradient for legibility */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/35 via-black/10 to-transparent"
        />

        {/* Status badge top-start */}
        <div className="absolute start-3 top-3">
          {isLive && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
              </span>
              {t("live")}
            </span>
          )}
          {isScheduled && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 backdrop-blur px-2.5 py-1 text-xs font-semibold text-brand-700 shadow-sm">
              <Radio className="h-3 w-3" />
              {locale === "ar" ? "قريباً" : "Upcoming"}
            </span>
          )}
          {isCompleted && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 backdrop-blur px-2.5 py-1 text-xs font-semibold text-muted-foreground shadow-sm">
              <CheckCircle2 className="h-3 w-3" />
              {locale === "ar" ? "مُسجل" : "Replay"}
            </span>
          )}
          {isCancelled && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 backdrop-blur px-2.5 py-1 text-xs font-semibold text-warning shadow-sm">
              <XCircle className="h-3 w-3" />
              {locale === "ar" ? "مُلغى" : "Cancelled"}
            </span>
          )}
        </div>

        {/* Free badge top-end */}
        {webinar.is_free && (
          <span className="absolute end-3 top-3 inline-flex items-center rounded-full bg-success px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
            {locale === "ar" ? "مجاني" : "Free"}
          </span>
        )}

        {/* Date tile bottom-start */}
        <div
          className={`absolute start-3 bottom-3 rounded-lg border ${accent.border} ${accent.bg} ${accent.fg} overflow-hidden text-center min-w-[52px] shadow-sm backdrop-blur-sm`}
        >
          <div className="text-[10px] font-bold tracking-wider px-2 pt-1">
            {monthShort}
          </div>
          <div className="text-xl font-bold leading-tight px-2 pb-1 tabular-nums">
            {day}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        {/* Title */}
        <h3 className="line-clamp-2 font-heading text-lg font-semibold leading-snug text-foreground group-hover:text-brand-700 transition-colors">
          {title}
        </h3>

        {/* Instructor */}
        {instructorName && (
          <p className="mt-1 text-sm text-muted-foreground">
            {locale === "ar" ? `بقلم ${instructorName}` : `By ${instructorName}`}
          </p>
        )}

        {/* Description */}
        {description && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}

        <div className="flex-1" />

        {/* Meta row */}
        <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {date.toLocaleDateString(
                locale === "ar" ? "ar-AE" : "en-US",
                { year: "numeric", month: "short", day: "numeric" }
              )}
            </span>
          </div>
          {!isCompleted && (
            <>
              <span className="h-3 w-px bg-border" aria-hidden />
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>{timeStr}</span>
              </div>
            </>
          )}
          {webinar.duration_minutes > 0 && (
            <>
              <span className="h-3 w-px bg-border" aria-hidden />
              <div className="flex items-center gap-1">
                <Play className="h-3.5 w-3.5" />
                <span>{formatDuration(webinar.duration_minutes)}</span>
              </div>
            </>
          )}
        </div>

        {/* Price + CTA */}
        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <div className="flex items-baseline gap-1.5">
            {webinar.is_free ? (
              <span className="text-lg font-bold text-success">
                {locale === "ar" ? "مجاني" : "Free"}
              </span>
            ) : (
              <span className="text-lg font-bold text-foreground">
                {formatCurrency(webinar.price, webinar.currency, locale)}
              </span>
            )}
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-600">
            {isCompleted
              ? t("watchReplay")
              : isLive
              ? t("joinNow") ?? "Join now"
              : t("registerNow")}
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}
