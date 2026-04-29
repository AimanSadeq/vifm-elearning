"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles, BookOpen, Globe2, GraduationCap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AnimatedSection } from "./AnimatedSection";

// Icon names are passed as strings so this client component can be used from
// a server component (functions/classes can't cross that boundary).
const HIGHLIGHT_ICONS: Record<string, LucideIcon> = {
  courses: BookOpen,
  bilingual: Globe2,
  region: GraduationCap,
};

type HighlightIconKey = keyof typeof HIGHLIGHT_ICONS;

interface CTAHighlight {
  icon: HighlightIconKey;
  value: string;
  label: string;
}

interface CTASectionProps {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaHref: string;
  /** Optional secondary CTA — typically "View pricing" or similar. */
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
  /** Tiny pill above the heading. Falls back to a sensible default per locale. */
  tagline?: string;
  /** Three feature/credibility tiles shown on the right side of the card. */
  highlights?: CTAHighlight[];
}

const DEFAULT_HIGHLIGHTS: CTAHighlight[] = [
  { icon: "courses", value: "50+", label: "Expert-led courses" },
  { icon: "bilingual", value: "EN · AR", label: "Bilingual platform" },
  { icon: "region", value: "GCC", label: "Region-focused" },
];

export function CTASection({
  title,
  subtitle,
  ctaText,
  ctaHref,
  secondaryCtaText,
  secondaryCtaHref,
  tagline,
  highlights = DEFAULT_HIGHLIGHTS,
}: CTASectionProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const prefersReducedMotion =
    mounted && typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : true;

  const animate = mounted && !prefersReducedMotion;

  return (
    <section className="bg-background py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <AnimatedSection>
          <div className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-brand-950 via-brand-900 to-brand-950 px-6 py-14 shadow-2xl shadow-brand-950/30 sm:px-10 lg:px-16 lg:py-20">
            {/* Soft blurred glow orbs — pure CSS, animate the hue subtly. */}
            <motion.div
              aria-hidden
              className="absolute -top-32 -right-24 -z-10 h-80 w-80 rounded-full bg-brand-400/30 blur-3xl"
              animate={animate ? { scale: [1, 1.12, 1], opacity: [0.25, 0.4, 0.25] } : undefined}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              aria-hidden
              className="absolute -bottom-32 -left-24 -z-10 h-72 w-72 rounded-full bg-brand-600/30 blur-3xl"
              animate={animate ? { scale: [1, 1.1, 1], opacity: [0.2, 0.35, 0.2] } : undefined}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            />
            {/* Faint dotted texture, masked at edges */}
            <div
              aria-hidden
              className="absolute inset-0 -z-10 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
            />

            <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-center">
              {/* Copy + CTAs */}
              <div className="text-white">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80 backdrop-blur-sm">
                  <Sparkles className="h-3.5 w-3.5" />
                  {tagline ?? "Start today"}
                </span>
                <h2 className="mt-5 font-heading text-3xl font-bold tracking-tight text-balance lg:text-4xl xl:text-5xl">
                  <span className="bg-gradient-to-br from-white via-white to-white/60 bg-clip-text text-transparent">
                    {title}
                  </span>
                </h2>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-white/70 lg:text-lg">
                  {subtitle}
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Link
                      href={ctaHref}
                      className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-brand-900 shadow-xl shadow-black/20 transition-colors hover:bg-brand-50"
                    >
                      {ctaText}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                    </Link>
                  </motion.div>
                  {secondaryCtaText && secondaryCtaHref && (
                    <Link
                      href={secondaryCtaHref}
                      className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.06] px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10"
                    >
                      {secondaryCtaText}
                    </Link>
                  )}
                </div>
              </div>

              {/* Highlights — three glass tiles stacked */}
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {highlights.map(({ icon, value, label }, i) => {
                  const Icon = HIGHLIGHT_ICONS[icon] ?? BookOpen;
                  return (
                  <motion.div
                    key={label}
                    initial={animate ? { opacity: 0, y: 16 } : false}
                    whileInView={animate ? { opacity: 1, y: 0 } : undefined}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.5, delay: 0.1 + i * 0.08, ease: "easeOut" }}
                    className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm transition-colors hover:bg-white/[0.07]"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/30 to-brand-700/30 text-brand-200 ring-1 ring-inset ring-white/10">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-heading text-lg font-bold leading-none text-white">
                        {value}
                      </p>
                      <p className="mt-1 truncate text-xs text-white/60">{label}</p>
                    </div>
                  </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
