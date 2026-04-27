"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import {
  Calendar,
  Clock,
  Users,
  Globe,
  Video,
  Radio,
  CalendarClock,
  CalendarCheck,
  CalendarX,
  CheckCircle2,
  Loader2,
  Lock,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { WebinarPricing } from "./WebinarPricing";
import { WebinarRecordingPlayer } from "./WebinarRecordingPlayer";
import { useAuth } from "@/lib/hooks/useAuth";
import { formatDate, formatDuration } from "@/lib/utils/formatters";
import type { Webinar } from "@/types";

interface WebinarDetailProps {
  webinar: Webinar;
  isRegistered: boolean;
  isRegistering: boolean;
  onRegister: () => void;
}

interface StatusMeta {
  label: string;
  Icon: typeof Radio;
  // Tailwind classes that color this status across the whole page —
  // single source of truth for tone (badge / hero ribbon / pricing top stripe).
  pillClasses: string;
  ribbonClasses: string;
  stripeClasses: string;
  pulse: boolean;
}

function getStatusMeta(
  status: Webinar["status"],
  locale: string
): StatusMeta | null {
  const isAr = locale === "ar";
  // Status tones live in the VIFM brand-blue family. Live's pulse dot stays
  // emerald (universal live indicator — small visual area), and cancelled
  // stays amber (universal warning). Everything else uses brand-* intensities
  // so the page reads as on-brand at a glance.
  switch (status) {
    case "scheduled":
      return {
        label: isAr ? "قادم" : "Upcoming",
        Icon: CalendarClock,
        pillClasses: "border-brand-300/60 bg-brand-400/20 text-brand-100",
        ribbonClasses: "from-brand-400/30 via-transparent",
        stripeClasses: "from-brand-400 to-brand-600",
        pulse: false,
      };
    case "live":
      return {
        label: isAr ? "مباشر" : "Live now",
        Icon: Radio,
        pillClasses: "border-emerald-300/60 bg-emerald-400/15 text-emerald-100",
        ribbonClasses: "from-brand-500/30 via-transparent",
        stripeClasses: "from-brand-500 to-brand-700",
        pulse: true,
      };
    case "completed":
      return {
        label: isAr ? "متاح للمشاهدة" : "On demand",
        Icon: CalendarCheck,
        pillClasses: "border-brand-200/60 bg-brand-300/15 text-brand-50",
        ribbonClasses: "from-brand-700/40 via-transparent",
        stripeClasses: "from-brand-600 to-brand-800",
        pulse: false,
      };
    case "cancelled":
      return {
        label: isAr ? "ملغي" : "Cancelled",
        Icon: CalendarX,
        pillClasses: "border-amber-300/60 bg-amber-400/15 text-amber-100",
        ribbonClasses: "from-amber-500/30 via-transparent",
        stripeClasses: "from-amber-500 to-orange-600",
        pulse: false,
      };
    default:
      return null;
  }
}

function splitDate(iso: string, locale: string) {
  // Build a "calendar block" representation: day number + short month + year.
  // Locale-aware via Intl so AR shows Arabic month names.
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return {
    day: d.toLocaleDateString(locale, { day: "numeric" }),
    month: d.toLocaleDateString(locale, { month: "short" }),
    year: d.toLocaleDateString(locale, { year: "numeric" }),
    weekday: d.toLocaleDateString(locale, { weekday: "long" }),
    time: d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }),
  };
}

export function WebinarDetail({
  webinar,
  isRegistered,
  isRegistering,
  onRegister,
}: WebinarDetailProps) {
  const t = useTranslations("webinars");
  const locale = useLocale();
  const { user, isLoading: isAuthLoading } = useAuth();

  const [hasWebinarFeature, setHasWebinarFeature] = useState<boolean | null>(
    null
  );
  useEffect(() => {
    // Don't probe features until auth has resolved — otherwise the effect
    // fires once anonymous on first paint, then again as soon as the user
    // session lands. user?.id is the stable identity to key off.
    if (isAuthLoading) return;
    fetch("/api/account/features")
      .then((r) => r.json())
      .then((j) => setHasWebinarFeature(Boolean(j.data?.features?.webinars)))
      .catch(() => setHasWebinarFeature(false));
  }, [user?.id, isAuthLoading]);

  const title =
    (locale === "ar" ? webinar.title_ar : webinar.title) ??
    webinar.title ??
    webinar.title_ar ??
    "(Untitled)";
  const description =
    locale === "ar" && webinar.description_ar
      ? webinar.description_ar
      : webinar.description;
  const instructor = webinar.instructor as unknown as
    | { full_name: string; full_name_ar?: string | null; avatar_url?: string | null }
    | undefined;
  const instructorName =
    locale === "ar" && instructor?.full_name_ar
      ? instructor.full_name_ar
      : instructor?.full_name;

  const status = getStatusMeta(webinar.status, locale);
  const isCompleted = webinar.status === "completed";
  const dateBlock = splitDate(webinar.scheduled_at, locale);

  return (
    <div className="bg-background">
      {/* ============================================================
          HERO — layered gradient mesh on dark, with a featured date tile
          ============================================================ */}
      <section className="relative isolate overflow-hidden bg-brand-950 text-white">
        {/* Gradient mesh on the VIFM Primary Blue (#010131) — pure CSS. The
            status's tone shades the whole hero (still in the brand family). */}
        <div
          className={`absolute inset-0 -z-10 bg-gradient-to-br ${status?.ribbonClasses ?? "from-brand-500/30 via-transparent"} to-transparent`}
        />
        <div
          aria-hidden
          className="absolute -left-32 top-[-120px] -z-10 h-[420px] w-[420px] rounded-full bg-brand-400/30 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute right-[-180px] bottom-[-160px] -z-10 h-[480px] w-[480px] rounded-full bg-brand-600/30 blur-3xl"
        />
        {/* Subtle grid overlay */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_75%)]"
        />

        <div className="container mx-auto px-4 pt-12 pb-16 sm:pt-16 sm:pb-20">
          {/* Top row — eyebrow + status pill */}
          <div className="mb-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.18em] text-white/50">
              <span className="hidden sm:inline">VIFM</span>
              <span className="hidden h-px w-8 bg-white/20 sm:block" />
              <span>{t("title")}</span>
            </div>
            {status && (
              <div
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider backdrop-blur-md ${status.pillClasses}`}
              >
                {status.pulse ? (
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
                  </span>
                ) : (
                  <status.Icon className="h-3.5 w-3.5" />
                )}
                {status.label}
              </div>
            )}
          </div>

          <div className="grid gap-12 lg:grid-cols-12 lg:items-end">
            {/* Left — title + description */}
            <div className="lg:col-span-8">
              <h1
                className="font-heading text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.5rem]"
                dir={locale === "ar" ? "rtl" : undefined}
              >
                <span className="bg-gradient-to-br from-white via-white to-white/60 bg-clip-text text-transparent">
                  {title}
                </span>
              </h1>

              {description && (
                <p
                  className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70"
                  dir={locale === "ar" ? "rtl" : undefined}
                >
                  {description}
                </p>
              )}

              {/* Instructor — featured */}
              {instructorName && (
                <div className="mt-8 flex items-center gap-4">
                  {instructor?.avatar_url ? (
                    // Stable URL on Supabase storage; let Next.js optimise it.
                    <Image
                      src={instructor.avatar_url}
                      alt={instructorName}
                      width={52}
                      height={52}
                      className="h-13 w-13 rounded-full ring-2 ring-white/20"
                    />
                  ) : (
                    <div className="flex h-13 w-13 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-base font-bold ring-2 ring-white/20">
                      {instructorName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/50">
                      {t("hostedBy")}
                    </p>
                    <p
                      className="text-base font-semibold"
                      dir={locale === "ar" ? "rtl" : undefined}
                    >
                      {instructorName}
                    </p>
                  </div>
                </div>
              )}

              {/* Tags as inline pills */}
              {webinar.tags && webinar.tags.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {webinar.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/70"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Right — featured date tile. Explicit dir on the inner card so
                the day-number / month-name pairing always reads predictably,
                regardless of the document's RTL inheritance. */}
            {dateBlock && (
              <div className="lg:col-span-4">
                <div className="relative">
                  <div
                    aria-hidden
                    className={`absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br ${status?.stripeClasses ?? "from-brand-500 to-brand-700"} opacity-30 blur-2xl`}
                  />
                  <div
                    dir={locale === "ar" ? "rtl" : "ltr"}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl"
                  >
                    <div className="flex items-baseline justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/50">
                          {dateBlock.weekday}
                        </p>
                        <p
                          className="mt-1 font-heading text-6xl font-bold leading-none"
                          dir="ltr"
                        >
                          {dateBlock.day}
                        </p>
                        <p className="mt-1 text-sm font-medium uppercase tracking-wider text-white/70">
                          {dateBlock.month} {dateBlock.year}
                        </p>
                      </div>
                      <div
                        className={`h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br ${status?.stripeClasses ?? "from-brand-500 to-brand-700"} p-[1px]`}
                      >
                        <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-brand-950">
                          {status?.Icon ? (
                            <status.Icon className="h-5 w-5 text-white" />
                          ) : (
                            <Calendar className="h-5 w-5 text-white" />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/50">
                          {t("scheduledAt")}
                        </p>
                        <p className="mt-0.5 text-sm font-semibold">
                          {dateBlock.time}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/50">
                          {t("duration")}
                        </p>
                        <p className="mt-0.5 text-sm font-semibold">
                          {formatDuration(webinar.duration_minutes)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ============================================================
          BODY
          ============================================================ */}
      <section className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-3 lg:gap-12">
          <div className="space-y-12 lg:col-span-2">
            {/* --- Recording (only when completed) --- */}
            {isCompleted && (
              <Section index="01" title={t("recording")}>
                {hasWebinarFeature === null ? (
                  <div className="flex aspect-video w-full items-center justify-center rounded-2xl border bg-muted/30">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("checkingAccess")}
                    </div>
                  </div>
                ) : hasWebinarFeature ? (
                  <div className="overflow-hidden rounded-2xl border bg-black shadow-xl ring-1 ring-black/5">
                    <WebinarRecordingPlayer
                      webinarId={webinar.id}
                      posterUrl={webinar.thumbnail_url}
                    />
                  </div>
                ) : (
                  <Card className="overflow-hidden border-amber-200 dark:border-amber-900/50">
                    <div className="bg-gradient-to-br from-amber-50 via-amber-50/60 to-transparent dark:from-amber-950/40 dark:to-amber-950/10">
                      <CardContent className="flex flex-col items-start gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
                        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700 ring-1 ring-amber-500/20 dark:text-amber-300">
                          <Lock className="h-6 w-6" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-semibold">
                            {!user
                              ? t("lockedTitleAnon")
                              : t("lockedTitleSubscriber")}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {!user
                              ? t("lockedDescAnon")
                              : t("lockedDescSubscriber")}
                          </p>
                        </div>
                        <Link
                          href={
                            !user
                              ? `/${locale}/login?redirect=/${locale}/webinars/${webinar.id}`
                              : `/${locale}/pricing`
                          }
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-br from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
                        >
                          {!user ? t("signIn") : t("upgradePlan")}
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </CardContent>
                    </div>
                  </Card>
                )}
              </Section>
            )}

            {/* --- About --- */}
            {description && (
              <Section index={isCompleted ? "02" : "01"} title={t("aboutWebinar")}>
                <div className="prose prose-neutral max-w-none dark:prose-invert">
                  <p
                    className="whitespace-pre-wrap text-base leading-relaxed text-muted-foreground"
                    dir={locale === "ar" ? "rtl" : undefined}
                  >
                    {description}
                  </p>
                </div>
              </Section>
            )}

            {/* --- What you'll get — bento grid --- */}
            <Section
              index={isCompleted ? "03" : description ? "02" : "01"}
              title={t("whatYoullGet")}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Benefit
                  highlight
                  label={t("benefitLiveQA")}
                  Icon={Radio}
                />
                <Benefit
                  label={t("benefitExpertInsights")}
                  Icon={Sparkles}
                />
                <Benefit
                  label={
                    isCompleted ? t("benefitWatchAnytime") : t("benefitInteractive")
                  }
                  Icon={isCompleted ? Video : Users}
                />
                <Benefit
                  label={t("benefitProfessional")}
                  Icon={CheckCircle2}
                />
              </div>
            </Section>

            {/* --- Info row --- */}
            <Section
              index={isCompleted ? "04" : description ? "03" : "02"}
              title={t("details")}
            >
              <div className="grid gap-4 sm:grid-cols-3">
                <InfoCard
                  Icon={Globe}
                  label={t("language")}
                  value={t("languageValue")}
                />
                <InfoCard
                  Icon={isCompleted ? Video : Radio}
                  label={t("format")}
                  value={isCompleted ? t("formatReplay") : t("formatLive")}
                />
                {webinar.max_attendees && (
                  <InfoCard
                    Icon={Users}
                    label={t("maxAttendees")}
                    value={String(webinar.max_attendees)}
                  />
                )}
              </div>
            </Section>
          </div>

          {/* Right rail — pricing */}
          <aside className="lg:col-span-1">
            <WebinarPricing
              webinar={webinar}
              isRegistered={isRegistered}
              hasWebinarFeature={hasWebinarFeature}
              isRegistering={isRegistering}
              onRegister={onRegister}
            />
          </aside>
        </div>
      </section>
    </div>
  );
}

// ----------------- helper components -----------------

function Section({
  index,
  title,
  children,
}: {
  index: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-5 flex items-baseline gap-3">
        <span className="font-heading text-sm font-medium text-brand-600/80 tabular-nums">
          {index}
        </span>
        <span className="h-px w-6 bg-border" />
        <h2 className="font-heading text-2xl font-bold tracking-tight">
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

function Benefit({
  label,
  Icon,
  highlight = false,
}: {
  label: string;
  Icon: React.ElementType;
  highlight?: boolean;
}) {
  return (
    <div
      className={`group relative flex items-start gap-4 rounded-xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-md ${
        highlight
          ? "border-brand-200 bg-gradient-to-br from-brand-50 to-transparent dark:border-brand-900/40 dark:from-brand-950/30"
          : "bg-card"
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
          highlight
            ? "bg-brand-600 text-white"
            : "bg-brand-50 text-brand-600 dark:bg-brand-950/40"
        }`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <p className="pt-1.5 text-sm font-medium leading-relaxed">{label}</p>
    </div>
  );
}

function InfoCard({
  Icon,
  label,
  value,
}: {
  Icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/40">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}
