"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  GraduationCap,
  Play,
  ShieldCheck,
  Sparkles,
  Video,
} from "lucide-react";

interface HeroContentProps {
  title: string;
  subtitle: string;
  exploreCTA: string;
  getStartedCTA: string;
  exploreHref: string;
  getStartedHref: string;
  badgeText: string;
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const wordVariants = {
  hidden: { opacity: 0, y: 30, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export function HeroContent({
  title,
  subtitle,
  exploreCTA,
  getStartedCTA,
  exploreHref,
  getStartedHref,
  badgeText,
}: HeroContentProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const prefersReducedMotion =
    mounted && typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : true;

  const animate = mounted && !prefersReducedMotion;
  const words = title.split(" ");

  return (
    <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-12">
      {/* ---------- LEFT — title + subtitle + CTAs ---------- */}
      <div className="lg:col-span-7">
        {/* Eyebrow row — small caps + brand pill, mirrors detail hero */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-[0.18em] text-white/50">
          <span>VIFM</span>
          <span className="hidden h-px w-8 bg-white/20 sm:block" />
          <motion.div
            className="inline-flex items-center gap-2 rounded-full border border-brand-300/60 bg-brand-400/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-100 backdrop-blur-md"
            initial={animate ? { opacity: 0, y: 10 } : false}
            animate={animate ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.5 }}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-300 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-300" />
            </span>
            {badgeText}
          </motion.div>
        </div>

        {/* Title with white→white/60 gradient text + staggered blur reveal */}
        <motion.h1
          className="mt-7 font-heading text-4xl font-bold leading-[1.12] tracking-tight sm:text-5xl lg:text-[3.5rem] xl:text-[4rem]"
          variants={animate ? containerVariants : undefined}
          initial={animate ? "hidden" : false}
          animate={animate ? "visible" : undefined}
        >
          {words.map((word, i) => (
            <motion.span
              key={i}
              className="inline-block me-[0.3em] pb-[0.12em] bg-gradient-to-br from-white via-white to-white/60 bg-clip-text text-transparent"
              variants={animate ? wordVariants : undefined}
            >
              {word}
            </motion.span>
          ))}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70"
          initial={animate ? { opacity: 0, y: 20 } : false}
          animate={animate ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
        >
          {subtitle}
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="mt-9 flex flex-wrap gap-3"
          initial={animate ? { opacity: 0, y: 20 } : false}
          animate={animate ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.5, delay: 0.9, ease: "easeOut" }}
        >
          <motion.div
            whileHover={animate ? { scale: 1.04 } : undefined}
            whileTap={animate ? { scale: 0.97 } : undefined}
          >
            <Link
              href={exploreHref}
              className="group relative inline-flex items-center gap-2 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:shadow-xl hover:shadow-brand-500/40"
            >
              {exploreCTA}
              <ArrowRight className="h-4 w-4 rtl:rotate-180 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
            </Link>
          </motion.div>
          <motion.div
            whileHover={animate ? { scale: 1.04 } : undefined}
            whileTap={animate ? { scale: 0.97 } : undefined}
          >
            <Link
              href={getStartedHref}
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/[0.08]"
            >
              <Play className="h-4 w-4 fill-current" />
              {getStartedCTA}
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* ---------- RIGHT — animated icon constellation ----------
          Abstract hub-and-orbit composition. A central pulsing brand mark
          surrounded by 6 floating icons that represent what VIFM offers
          (courses, certificates, analytics, webinars, careers, accreditation).
          Each orbit has its own duration and delay so the motion never syncs
          up — the scene feels alive without being noisy. */}
      <HeroIconScene animate={animate} />
    </div>
  );
}

interface OrbitIcon {
  Icon: React.ElementType;
  /** Top/left percentages within the square scene (0–100). */
  top: number;
  left: number;
  size: "sm" | "md" | "lg";
  duration: number;
  delay: number;
  tone: "primary" | "accent" | "soft";
}

const ORBIT_ICONS: OrbitIcon[] = [
  { Icon: BookOpen,       top: 12, left: 18, size: "md", duration: 6.0, delay: 0.0, tone: "primary" },
  { Icon: Award,          top: 8,  left: 72, size: "lg", duration: 7.2, delay: 0.6, tone: "accent" },
  { Icon: BarChart3,      top: 38, left: 6,  size: "sm", duration: 5.4, delay: 1.2, tone: "soft" },
  { Icon: Video,          top: 42, left: 86, size: "md", duration: 6.6, delay: 0.3, tone: "primary" },
  { Icon: GraduationCap,  top: 70, left: 22, size: "lg", duration: 7.8, delay: 0.9, tone: "accent" },
  { Icon: ShieldCheck,    top: 76, left: 70, size: "sm", duration: 5.8, delay: 1.5, tone: "soft" },
];

function HeroIconScene({ animate }: { animate: boolean }) {
  const sizeClass = {
    sm: "h-10 w-10 rounded-xl",
    md: "h-14 w-14 rounded-2xl",
    lg: "h-16 w-16 rounded-2xl",
  };
  const iconSize = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-7 w-7" };
  const toneClass = {
    primary:
      "bg-gradient-to-br from-brand-400/30 to-brand-600/30 text-brand-100 ring-1 ring-brand-300/30 shadow-lg shadow-brand-500/20",
    accent:
      "bg-white/10 text-white ring-1 ring-white/20 shadow-lg shadow-white/10",
    soft:
      "bg-brand-700/40 text-brand-200 ring-1 ring-brand-400/20 shadow-md shadow-brand-500/10",
  };

  return (
    <div className="lg:col-span-5">
      <motion.div
        className="relative mx-auto aspect-square w-full max-w-[420px]"
        initial={animate ? { opacity: 0, scale: 0.95 } : false}
        animate={animate ? { opacity: 1, scale: 1 } : undefined}
        transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
      >
        {/* Three concentric pulsing rings emanate from the hub */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            aria-hidden
            className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand-400/20"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={
              animate
                ? { scale: [0.6, 2.2, 2.2], opacity: [0.4, 0, 0] }
                : { scale: 1.2, opacity: 0.15 }
            }
            transition={
              animate
                ? { duration: 4, delay: i * 1.3, repeat: Infinity, ease: "easeOut" }
                : undefined
            }
          />
        ))}

        {/* Static orbit guide rings — read as "scene scaffolding" */}
        <div
          aria-hidden
          className="absolute left-1/2 top-1/2 h-[55%] w-[55%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.06]"
        />
        <div
          aria-hidden
          className="absolute left-1/2 top-1/2 h-[80%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.04]"
        />

        {/* Central hub */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          animate={animate ? { rotate: [0, 360] } : undefined}
          transition={
            animate
              ? { duration: 60, repeat: Infinity, ease: "linear" }
              : undefined
          }
        >
          <div className="relative">
            <div
              aria-hidden
              className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 opacity-50 blur-xl"
            />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 shadow-2xl shadow-brand-500/40 ring-1 ring-white/20">
              <Sparkles className="h-9 w-9 text-white drop-shadow" />
            </div>
          </div>
        </motion.div>

        {/* Floating orbit icons */}
        {ORBIT_ICONS.map(({ Icon, top, left, size, duration, delay, tone }, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{ top: `${top}%`, left: `${left}%` }}
            initial={animate ? { opacity: 0, scale: 0 } : { opacity: 1, scale: 1 }}
            animate={
              animate
                ? {
                    opacity: 1,
                    scale: 1,
                    y: [0, -12, 0],
                    x: [0, i % 2 === 0 ? 6 : -6, 0],
                  }
                : undefined
            }
            transition={
              animate
                ? {
                    opacity: { duration: 0.6, delay: 0.6 + i * 0.12 },
                    scale: { duration: 0.6, delay: 0.6 + i * 0.12, type: "spring" },
                    y: { duration, delay, repeat: Infinity, ease: "easeInOut" },
                    x: { duration: duration * 1.3, delay, repeat: Infinity, ease: "easeInOut" },
                  }
                : undefined
            }
          >
            <div
              className={`flex items-center justify-center backdrop-blur-md ${sizeClass[size]} ${toneClass[tone]}`}
            >
              <Icon className={iconSize[size]} />
            </div>
          </motion.div>
        ))}

        {/* Glowing dots scattered between icons for extra detail */}
        {[
          { top: 30, left: 50, delay: 0 },
          { top: 55, left: 48, delay: 1.5 },
          { top: 22, left: 45, delay: 0.8 },
        ].map((dot, i) => (
          <motion.span
            key={i}
            aria-hidden
            className="absolute h-1.5 w-1.5 rounded-full bg-brand-300"
            style={{ top: `${dot.top}%`, left: `${dot.left}%` }}
            animate={
              animate
                ? { opacity: [0.2, 1, 0.2], scale: [0.8, 1.4, 0.8] }
                : undefined
            }
            transition={
              animate
                ? { duration: 2.5, delay: dot.delay, repeat: Infinity, ease: "easeInOut" }
                : undefined
            }
          />
        ))}
      </motion.div>
    </div>
  );
}
