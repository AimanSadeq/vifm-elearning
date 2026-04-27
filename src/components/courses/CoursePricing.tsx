"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Award,
  BookOpen,
  Clock,
  Globe,
  Loader2,
  PlayCircle,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/formatters";
import { useAuth } from "@/lib/hooks/useAuth";
import type { Course, Enrollment } from "@/types";

interface CoursePricingProps {
  course: Course;
  enrollment?: Enrollment | null;
}

export function CoursePricing({ course, enrollment }: CoursePricingProps) {
  const t = useTranslations("courses");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuth();
  const [isEnrolling, setIsEnrolling] = useState(false);

  const handleEnroll = async () => {
    if (!user) {
      router.push(`/${locale}/login`);
      return;
    }

    if (enrollment) {
      router.push(`/${locale}/courses/${course.slug}/learn`);
      return;
    }

    // The API allows enrollment for free courses, admins, and active
    // subscribers. Paid + no sub returns 400 — fall through to checkout.
    setIsEnrolling(true);
    try {
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: course.id }),
      });
      const { error } = await res.json();

      if (res.ok) {
        router.push(`/${locale}/courses/${course.slug}/learn`);
        return;
      }
      router.push(`/${locale}/courses/${course.slug}/checkout`);
      if (error && !error.toLowerCase().includes("payment")) {
        alert(error);
      }
    } finally {
      setIsEnrolling(false);
    }
  };

  const buttonText = enrollment ? t("continueLearning") : tc("enrollNow");

  return (
    <div className="lg:sticky lg:top-24">
      <div className="overflow-hidden rounded-2xl border bg-card shadow-lg ring-1 ring-black/5">
        {/* Cover thumbnail — sits at the top of the card. Falls back to a
            gradient + course-initial placeholder when no thumbnail is set. */}
        <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-brand-100 to-brand-50 dark:from-brand-900/40 dark:to-brand-950/30">
          {course.thumbnail_url ? (
            // Lazy-loaded — the pricing card stacks below the content on
            // mobile, so this image is rarely the LCP and shouldn't compete
            // with the hero for connection priority.
            <Image
              src={course.thumbnail_url}
              alt={course.title ?? "Course"}
              fill
              sizes="(min-width: 1024px) 33vw, 100vw"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <PlayCircle className="h-12 w-12 text-brand-300/80 dark:text-brand-200/30" />
            </div>
          )}
        </div>

        <div className="p-6">
          {/* Eyebrow */}
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {course.is_free ? t("free") : tc("enrollNow")}
          </p>

          {/* Price */}
          <div className="mt-1 flex items-baseline gap-2">
            {course.is_free ? (
              <span className="font-heading text-4xl font-bold leading-none text-emerald-600 dark:text-emerald-400">
                {t("free")}
              </span>
            ) : (
              <span className="font-heading text-4xl font-bold leading-none">
                {formatCurrency(course.price, course.currency, locale)}
              </span>
            )}
          </div>

          {/* Primary CTA */}
          <div className="mt-5">
            <Button
              className="w-full shadow-md"
              size="lg"
              onClick={handleEnroll}
              disabled={isEnrolling}
            >
              {isEnrolling && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              {buttonText}
            </Button>
          </div>

          {/* Includes — refined list with icon plates */}
          <div className="mt-6 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("includes")}
            </p>

            {course.duration_hours != null && course.duration_hours > 0 && (
              <IncludeRow
                Icon={Clock}
                label={`${course.duration_hours} ${t("hours")} ${t("ofExpertContent")}`}
              />
            )}
            <IncludeRow Icon={BookOpen} label={t("lifetimeAccess")} />
            {course.certificate_enabled && (
              <IncludeRow Icon={Award} label={t("certificateIncluded")} />
            )}
            <IncludeRow Icon={Globe} label={t("languageValue")} muted />
            <IncludeRow Icon={ShieldCheck} label={t("moneyBack")} muted />
          </div>
        </div>
      </div>
    </div>
  );
}

function IncludeRow({
  Icon,
  label,
  muted = false,
}: {
  Icon: React.ElementType;
  label: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
          muted
            ? "bg-muted text-muted-foreground"
            : "bg-brand-50 text-brand-600 dark:bg-brand-950/40"
        }`}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span
        className={`text-sm ${muted ? "text-muted-foreground" : "text-foreground"}`}
      >
        {label}
      </span>
    </div>
  );
}
