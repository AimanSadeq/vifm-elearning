"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";

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
    <div className="max-w-4xl">
      {/* Status badge */}
      <motion.div
        className="inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-400/10 px-4 py-1.5 text-sm text-brand-200"
        initial={animate ? { opacity: 0, y: 10 } : false}
        animate={animate ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.5 }}
      >
        <motion.span
          className="h-2 w-2 rounded-full bg-brand-400"
          animate={animate ? { opacity: [1, 0.4, 1] } : undefined}
          transition={{ duration: 2, repeat: Infinity }}
        />
        {badgeText}
      </motion.div>

      {/* Staggered title with blur reveal */}
      <motion.h1
        className="mt-8 font-heading text-4xl font-bold leading-[1.1] tracking-tight lg:text-6xl xl:text-7xl"
        variants={animate ? containerVariants : undefined}
        initial={animate ? "hidden" : false}
        animate={animate ? "visible" : undefined}
      >
        {words.map((word, i) => (
          <motion.span
            key={i}
            className="inline-block me-[0.3em]"
            variants={animate ? wordVariants : undefined}
          >
            {word}
          </motion.span>
        ))}
      </motion.h1>

      {/* Gradient accent line */}
      <motion.div
        className="mt-6 h-1 rounded-full bg-gradient-to-r from-brand-400 to-brand-300 origin-left rtl:origin-right"
        initial={animate ? { scaleX: 0, opacity: 0 } : false}
        animate={animate ? { scaleX: 1, opacity: 1 } : undefined}
        transition={{ duration: 0.8, delay: 0.7, ease: "easeOut" }}
        style={{ width: 100 }}
      />

      {/* Subtitle */}
      <motion.p
        className="mt-6 max-w-2xl text-lg text-brand-200/80 lg:text-xl leading-relaxed"
        initial={animate ? { opacity: 0, y: 20 } : false}
        animate={animate ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
      >
        {subtitle}
      </motion.p>

      {/* CTA buttons */}
      <motion.div
        className="mt-10 flex flex-wrap gap-4"
        initial={animate ? { opacity: 0, y: 20 } : false}
        animate={animate ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.5, delay: 0.9, ease: "easeOut" }}
      >
        <motion.div whileHover={animate ? { scale: 1.04 } : undefined} whileTap={animate ? { scale: 0.97 } : undefined}>
          <Link
            href={exploreHref}
            className="group relative inline-flex items-center gap-2 rounded-full bg-brand-400 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-brand-400/25 hover:bg-brand-300 transition-colors"
          >
            {exploreCTA}
            <ArrowRight className="h-4 w-4 rtl:rotate-180 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
          </Link>
        </motion.div>
        <motion.div whileHover={animate ? { scale: 1.04 } : undefined} whileTap={animate ? { scale: 0.97 } : undefined}>
          <Link
            href={getStartedHref}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm px-8 py-4 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
          >
            <Play className="h-4 w-4 fill-current" />
            {getStartedCTA}
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
