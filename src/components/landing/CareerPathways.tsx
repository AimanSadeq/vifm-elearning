"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  GraduationCap,
  Briefcase,
  Crown,
  ArrowRight,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { AnimatedSection } from "./AnimatedSection";
import { cn } from "@/lib/utils/cn";

interface TierData {
  id: string;
  title: string;
  description: string;
  highlights: string[];
  designationLabel: string;
}

interface CareerPathwaysProps {
  sectionTitle: string;
  sectionSubtitle: string;
  tiers: TierData[];
  ctaText: string;
  ctaHref: string;
  /** Numbered index ("04") rendered as a dark-themed SectionMarker inside
   *  this component, since the section's bg-brand-950 canvas would clash
   *  with a light-background marker placed above it. */
  markerIndex?: string;
}

const TIER_VISUAL: Record<
  string,
  {
    icon: LucideIcon;
    color: string;
    bgColor: string;
    borderColor: string;
    glowColor: string;
    step: string;
  }
> = {
  gateway: {
    icon: GraduationCap,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
    borderColor: "border-emerald-500/30",
    glowColor: "bg-emerald-500/10",
    step: "01",
  },
  professional: {
    icon: Briefcase,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    borderColor: "border-blue-500/30",
    glowColor: "bg-blue-500/10",
    step: "02",
  },
  executive: {
    icon: Crown,
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
    borderColor: "border-amber-500/30",
    glowColor: "bg-amber-500/10",
    step: "03",
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.2 } },
};

export function CareerPathways({
  markerIndex,
  sectionTitle,
  sectionSubtitle,
  tiers,
  ctaText,
  ctaHref,
}: CareerPathwaysProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const prefersReducedMotion =
    mounted && typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : true;

  return (
    <section className="relative overflow-hidden bg-brand-950 py-20 lg:py-28 text-white">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="container relative mx-auto px-4">
        {/* Dark-themed marker — renders the same numbered editorial header
            as SectionMarker but tuned for white-on-brand-950 contrast. */}
        {markerIndex && (
          <AnimatedSection>
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <div className="flex items-baseline justify-center gap-3">
                <span className="font-heading text-sm font-medium tabular-nums text-white/40">
                  {markerIndex}
                </span>
                <span className="h-px w-6 bg-white/20" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-300">
                  {sectionSubtitle}
                </span>
              </div>
              <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight lg:text-4xl xl:text-5xl">
                <span className="bg-gradient-to-br from-white via-white to-white/60 bg-clip-text text-transparent">
                  {sectionTitle}
                </span>
              </h2>
            </div>
          </AnimatedSection>
        )}

        {/* Timeline */}
        <motion.div
          ref={ref}
          className="relative mt-16 lg:mt-20"
          variants={prefersReducedMotion ? undefined : containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {/* Vertical line — desktop only */}
          <div className="absolute start-6 top-0 bottom-0 hidden w-px bg-gradient-to-b from-emerald-500/50 via-blue-500/50 to-amber-500/50 lg:start-1/2 lg:block" />

          {/* Mobile vertical line */}
          <div className="absolute start-6 top-0 bottom-0 w-px bg-gradient-to-b from-emerald-500/50 via-blue-500/50 to-amber-500/50 lg:hidden" />

          <div className="space-y-12 lg:space-y-16">
            {tiers.map((tier, i) => {
              const visual = TIER_VISUAL[tier.id];
              if (!visual) return null;
              const Icon = visual.icon;
              const isEven = i % 2 === 0;

              return (
                <motion.div
                  key={tier.id}
                  variants={cardVariants}
                  className="relative"
                >
                  {/* Timeline node */}
                  <div
                    className={cn(
                      "absolute start-0 z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 lg:start-1/2 lg:-translate-x-1/2",
                      visual.bgColor,
                      visual.borderColor
                    )}
                  >
                    <Icon className={cn("h-5 w-5", visual.color)} />
                  </div>

                  {/* Card — alternates left/right on desktop */}
                  <div
                    className={cn(
                      "ms-16 lg:ms-0 lg:w-[calc(50%-40px)]",
                      isEven ? "lg:me-auto" : "lg:ms-auto"
                    )}
                  >
                    <div
                      className={cn(
                        "relative rounded-2xl border bg-white/[0.04] backdrop-blur-sm p-6 lg:p-8 transition-colors hover:bg-white/[0.07]",
                        visual.borderColor
                      )}
                    >
                      {/* Glow effect */}
                      <div
                        className={cn(
                          "absolute -top-8 -end-8 h-32 w-32 rounded-full blur-3xl opacity-30",
                          visual.glowColor
                        )}
                      />

                      <div className="relative">
                        {/* Step number + title */}
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "text-xs font-bold tracking-wider opacity-60",
                              visual.color
                            )}
                          >
                            STEP {visual.step}
                          </span>
                          {tier.designationLabel && (
                            <span
                              className={cn(
                                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                                visual.bgColor,
                                visual.color
                              )}
                            >
                              {tier.designationLabel}
                            </span>
                          )}
                        </div>

                        <h3 className="mt-3 font-heading text-xl font-bold lg:text-2xl">
                          {tier.title}
                        </h3>

                        <p className="mt-3 text-sm leading-relaxed text-brand-300/70 lg:text-base">
                          {tier.description}
                        </p>

                        {/* Highlights */}
                        <ul className="mt-5 space-y-2.5">
                          {tier.highlights.map((h, j) => (
                            <li
                              key={j}
                              className="flex items-start gap-2.5"
                            >
                              <span
                                className={cn(
                                  "mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white",
                                  visual.color.replace("text-", "bg-")
                                )}
                              >
                                ✓
                              </span>
                              <span className="text-sm text-brand-200/80">
                                {h}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Connector arrow between tiers */}
                  {i < tiers.length - 1 && (
                    <div className="absolute start-[18px] -bottom-8 z-10 flex items-center justify-center lg:start-1/2 lg:-translate-x-1/2 lg:-bottom-10">
                      <ChevronDown className="h-5 w-5 text-brand-400/40" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* CTA */}
        <AnimatedSection delay={0.4}>
          <div className="mt-16 text-center">
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-500"
            >
              {ctaText}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
