"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowUpRight,
  CheckCircle,
  Clock,
  Loader2,
  Lock,
  Radio,
  ShieldCheck,
  Users,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDuration } from "@/lib/utils/formatters";
import { useAuth } from "@/lib/hooks/useAuth";
import type { Webinar } from "@/types";

interface WebinarPricingProps {
  webinar: Webinar;
  isRegistered: boolean;
  hasWebinarFeature: boolean | null;
  isRegistering: boolean;
  onRegister: () => void;
}

export function WebinarPricing({
  webinar,
  isRegistered,
  hasWebinarFeature,
  isRegistering,
  onRegister,
}: WebinarPricingProps) {
  const t = useTranslations("webinars");
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuth();
  const [localRegistering, setLocalRegistering] = useState(false);
  const showSpinner = isRegistering || localRegistering;

  const isCompleted = webinar.status === "completed";
  const isLive = webinar.status === "live";
  const isScheduled = webinar.status === "scheduled";
  const isCancelled = webinar.status === "cancelled";
  const canRegister = (isScheduled || isLive) && !isRegistered;

  const handleRegisterClick = async () => {
    if (!user) {
      router.push(`/${locale}/login?redirect=/${locale}/webinars/${webinar.id}`);
      return;
    }
    setLocalRegistering(true);
    try {
      await onRegister();
    } finally {
      setLocalRegistering(false);
    }
  };

  return (
    <div className="lg:sticky lg:top-24">
      <div className="overflow-hidden rounded-2xl border bg-card shadow-lg ring-1 ring-black/5">
        <div className="p-6">
          {/* Eyebrow — status confirmation in the card itself */}
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {webinar.is_free ? t("free") : t("ticketPrice")}
          </p>

          {/* Price */}
          <div className="mt-1 flex items-baseline gap-2">
            {webinar.is_free ? (
              <span className="font-heading text-4xl font-bold leading-none text-emerald-600 dark:text-emerald-400">
                {t("free")}
              </span>
            ) : (
              <span className="font-heading text-4xl font-bold leading-none">
                {formatCurrency(webinar.price, webinar.currency, locale)}
              </span>
            )}
          </div>

          {/* Primary CTA */}
          <div className="mt-5">
            {isCancelled ? (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-center text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                {t("cancelledNotice")}
              </div>
            ) : isRegistered && !isCompleted ? (
              <div className="flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
                <CheckCircle className="h-5 w-5" />
                {t("registered")}
              </div>
            ) : canRegister ? (
              <Button
                className="w-full shadow-md"
                size="lg"
                onClick={handleRegisterClick}
                disabled={showSpinner}
              >
                {showSpinner ? (
                  <Loader2 className="h-4 w-4 me-2 animate-spin" />
                ) : isLive ? (
                  <Radio className="h-4 w-4 me-2" />
                ) : null}
                {isLive ? t("joinLive") : t("registerNow")}
              </Button>
            ) : isCompleted ? (
              (webinar.is_free ? Boolean(user) : hasWebinarFeature) ? (
                <div className="rounded-lg border bg-muted/40 p-3 text-center text-sm text-muted-foreground">
                  {t("airedWithRecording")}
                </div>
              ) : (
                <Link
                  href={
                    !user
                      ? `/${locale}/login?redirect=/${locale}/webinars/${webinar.id}`
                      : `/${locale}/pricing`
                  }
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-brand-600 to-brand-700 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
                >
                  {!user ? t("signIn") : t("upgradePlan")}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              )
            ) : null}
          </div>

          {/* Includes — refined list with icon plates */}
          <div className="mt-6 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("includes")}
            </p>
            <IncludeRow
              Icon={Clock}
              label={formatDuration(webinar.duration_minutes)}
            />
            {!isCompleted && (
              <IncludeRow Icon={Radio} label={t("liveSession")} />
            )}
            {isCompleted &&
              ((webinar.is_free ? Boolean(user) : hasWebinarFeature) ? (
                <IncludeRow Icon={Video} label={t("recordingAccess")} />
              ) : (
                <IncludeRow Icon={Lock} label={t("recordingLockedShort")} muted />
              ))}
            {webinar.max_attendees && (
              <IncludeRow
                Icon={Users}
                label={`${t("maxAttendees")}: ${webinar.max_attendees}`}
              />
            )}
            <IncludeRow
              Icon={ShieldCheck}
              label={t("languageValue")}
              muted
            />
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
