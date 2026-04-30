"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Award,
  BarChart3,
  GraduationCap,
  RefreshCw,
  Shield,
  Users,
} from "lucide-react";
import { AnimatedSection } from "@/components/landing/AnimatedSection";

interface DesignationHeroProps {
  name: string;
  abbreviation: string;
  description: string;
  prerequisites: string[];
  locale: string;
  slug: string;
  /** Optional rich data — drives the "at a glance" tile on the right. */
  tier?: "gateway" | "professional" | "executive" | null;
  foundingFee?: number;
  currency?: string;
  cpeHours?: number;
  cpeCycleYears?: number;
  holderCount?: number;
}

interface TierMeta {
  label: string;
  ribbonClasses: string;
  stripeClasses: string;
  pillClasses: string;
}

function getTierMeta(
  tier: string | null | undefined,
  labels: { gateway: string; professional: string; executive: string }
): TierMeta {
  switch (tier) {
    case "gateway":
      return {
        label: labels.gateway,
        ribbonClasses: "from-brand-300/30 via-transparent",
        stripeClasses: "from-brand-300 to-brand-500",
        pillClasses: "border-brand-200/60 bg-brand-300/15 text-brand-50",
      };
    case "professional":
      return {
        label: labels.professional,
        ribbonClasses: "from-brand-500/35 via-transparent",
        stripeClasses: "from-brand-500 to-brand-700",
        pillClasses: "border-brand-300/60 bg-brand-500/20 text-brand-100",
      };
    case "executive":
      return {
        label: labels.executive,
        ribbonClasses: "from-brand-700/40 via-transparent",
        stripeClasses: "from-brand-700 to-brand-900",
        pillClasses: "border-brand-400/60 bg-brand-700/30 text-brand-50",
      };
    default:
      return {
        label: "",
        ribbonClasses: "from-brand-500/30 via-transparent",
        stripeClasses: "from-brand-500 to-brand-700",
        pillClasses: "border-brand-300/60 bg-brand-400/15 text-brand-100",
      };
  }
}

function formatFee(fee: number, currency: string, locale: string): string {
  const cur = currency || "USD";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: cur,
      maximumFractionDigits: 0,
      numberingSystem: "latn",
    }).format(fee);
  } catch {
    return `${cur} ${fee}`;
  }
}

export function DesignationHero({
  name,
  abbreviation,
  description,
  prerequisites,
  locale,
  slug,
  tier,
  foundingFee,
  currency = "USD",
  cpeHours,
  cpeCycleYears,
  holderCount,
}: DesignationHeroProps) {
  const prefersReducedMotion = useReducedMotion();
  const isAr = locale === "ar";

  const tierLabels = isAr
    ? { gateway: "تأسيسي", professional: "مهني", executive: "تنفيذي" }
    : { gateway: "Gateway", professional: "Professional", executive: "Executive" };
  const tierMeta = getTierMeta(tier, tierLabels);

  return (
    <section className="relative isolate overflow-hidden bg-brand-950 text-white">
      {/* Tier-tinted gradient ribbon — same trick CourseDetail uses to tone
          the whole hero based on a single class. */}
      <div
        aria-hidden
        className={`absolute inset-0 -z-10 bg-gradient-to-br ${tierMeta.ribbonClasses} to-transparent`}
      />

      {/* Glow orbs */}
      {!prefersReducedMotion ? (
        <>
          <motion.div
            aria-hidden
            className="absolute -left-32 top-[-120px] -z-10 h-[420px] w-[420px] rounded-full bg-brand-400/30 blur-3xl"
            animate={{ scale: [1, 1.12, 1], opacity: [0.2, 0.35, 0.2] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            aria-hidden
            className="absolute right-[-180px] bottom-[-160px] -z-10 h-[480px] w-[480px] rounded-full bg-brand-600/30 blur-3xl"
            animate={{ scale: [1, 1.15, 1], opacity: [0.18, 0.3, 0.18] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
        </>
      ) : (
        <>
          <div aria-hidden className="absolute -left-32 top-[-120px] -z-10 h-[420px] w-[420px] rounded-full bg-brand-400/30 blur-3xl opacity-30" />
          <div aria-hidden className="absolute right-[-180px] bottom-[-160px] -z-10 h-[480px] w-[480px] rounded-full bg-brand-600/30 blur-3xl opacity-25" />
        </>
      )}

      {/* Faint grid texture, masked toward the edges */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_75%)]"
      />

      <div className="container relative z-10 mx-auto px-4 pt-12 pb-16 sm:pt-16 sm:pb-20">
        {/* Eyebrow — VIFM · "Professional Designation" · tier pill */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.18em] text-white/70">
            <span>VIFM</span>
            <span className="hidden h-px w-8 bg-white/20 sm:block" />
            <span>{isAr ? "تسمية مهنية" : "Professional Designation"}</span>
          </div>
          {tier && (
            <div
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider backdrop-blur-md ${tierMeta.pillClasses}`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              {tierMeta.label}
            </div>
          )}
        </div>

        <AnimatedSection>
          <div className="grid gap-12 lg:grid-cols-12 lg:items-end">
            {/* Left — title + abbreviation + description + CTAs */}
            <div className="lg:col-span-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-400/10 px-3 py-1 text-xs font-medium text-brand-200">
                <Award className="h-3.5 w-3.5" />
                {abbreviation}
              </div>

              <h1
                className="mt-5 font-heading text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.25rem]"
                dir={isAr ? "rtl" : undefined}
              >
                <span className="bg-gradient-to-br from-white via-white to-white/60 bg-clip-text text-transparent">
                  {name}
                </span>
              </h1>

              {description && (
                <p
                  className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70"
                  dir={isAr ? "rtl" : undefined}
                >
                  {description}
                </p>
              )}

              {prerequisites.length > 0 && (
                <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-sm text-white/80 backdrop-blur-sm">
                  <Shield className="h-4 w-4" />
                  {isAr
                    ? `يتطلب: ${prerequisites.join(" أو ")}`
                    : `Requires: ${prerequisites.join(" or ")}`}
                </div>
              )}

              {/* CTAs */}
              <div className="mt-10 flex flex-wrap gap-3">
                <Link
                  href={`/${locale}/courses`}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-brand-900 shadow-xl shadow-black/20 transition-colors hover:bg-brand-50"
                >
                  <GraduationCap className="h-4 w-4" />
                  {isAr ? "احصل على الشهادة" : "Get Certified"}
                </Link>
                <Link
                  href={`/${locale}/designations/${slug}/registry`}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/[0.06] px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10"
                >
                  <Users className="h-4 w-4" />
                  {isAr ? "عرض السجل" : "View Registry"}
                </Link>
                <Link
                  href={`/${locale}/dashboard/designations/renew`}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/[0.06] px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10"
                >
                  <RefreshCw className="h-4 w-4" />
                  {isAr ? "تجديد" : "Renew"}
                </Link>
              </div>
            </div>

            {/* Right — "At a glance" glass tile */}
            <div className="lg:col-span-4">
              <div className="relative">
                <div
                  aria-hidden
                  className={`absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br ${tierMeta.stripeClasses} opacity-30 blur-2xl`}
                />
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl">
                  <div className="p-6">
                    <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/70">
                      {isAr ? "نظرة سريعة" : "At a glance"}
                    </p>

                    {/* Hero stat — fee */}
                    {foundingFee !== undefined && (
                      <div className="mt-2">
                        <p className="font-heading text-5xl font-bold leading-none">
                          {foundingFee === 0
                            ? isAr
                              ? "مجاني"
                              : "Free"
                            : formatFee(foundingFee, currency, locale)}
                        </p>
                        <p className="mt-1 text-xs text-white/75">
                          {isAr ? "رسوم العضوية المؤسسة" : "Founding membership fee"}
                        </p>
                      </div>
                    )}

                    {/* Stat strip */}
                    <div className="mt-5 grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                      {cpeHours !== undefined && cpeHours > 0 && (
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/70">
                            {isAr ? "ساعات CPE" : "CPE Hours"}
                          </p>
                          <p className="mt-0.5 text-sm font-semibold">
                            {cpeHours}
                            <span className="ms-1 text-white/70">
                              /{" "}
                              {cpeCycleYears && cpeCycleYears !== 1
                                ? isAr
                                  ? `${cpeCycleYears} سنوات`
                                  : `${cpeCycleYears} yrs`
                                : isAr
                                  ? "سنة"
                                  : "yr"}
                            </span>
                          </p>
                        </div>
                      )}
                      {tier && (
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/70">
                            {isAr ? "المستوى" : "Tier"}
                          </p>
                          <p className="mt-0.5 text-sm font-semibold">
                            {tierMeta.label}
                          </p>
                        </div>
                      )}
                      {holderCount !== undefined && holderCount > 0 && (
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/70">
                            {isAr ? "حاملو الشهادة" : "Holders"}
                          </p>
                          <p className="mt-0.5 text-sm font-semibold">
                            {holderCount.toLocaleString(locale, { numberingSystem: "latn" })}
                          </p>
                        </div>
                      )}
                      {prerequisites.length > 0 && (
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/70">
                            {isAr ? "متطلبات مسبقة" : "Prerequisites"}
                          </p>
                          <p className="mt-0.5 text-sm font-semibold">
                            {prerequisites.length}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
