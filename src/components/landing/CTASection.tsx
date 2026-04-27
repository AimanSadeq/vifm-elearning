"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AnimatedSection } from "./AnimatedSection";

interface CTASectionProps {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaHref: string;
}

export function CTASection({ title, subtitle, ctaText, ctaHref }: CTASectionProps) {
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
    <section className="relative isolate overflow-hidden bg-brand-950 py-24 lg:py-32">
      {/* Brand-blue gradient mesh — pure CSS, matches the detail pages' hero
          treatment so the home and detail pages read as one design system. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-500/30 via-transparent to-transparent"
      />
      <motion.div
        aria-hidden
        className="absolute -top-40 -right-32 -z-10 h-[480px] w-[480px] rounded-full bg-brand-400/30 blur-3xl"
        animate={animate ? { scale: [1, 1.15, 1], opacity: [0.25, 0.4, 0.25] } : undefined}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute -bottom-40 -left-32 -z-10 h-[440px] w-[440px] rounded-full bg-brand-600/30 blur-3xl"
        animate={animate ? { scale: [1, 1.12, 1], opacity: [0.2, 0.35, 0.2] } : undefined}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      {/* Subtle grid overlay, masked at the edges */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_75%)]"
      />

      <div className="container relative z-10 mx-auto px-4 text-center text-white">
        <AnimatedSection>
          <h2 className="font-heading text-3xl font-bold tracking-tight lg:text-5xl xl:text-6xl">
            <span className="bg-gradient-to-br from-white via-white to-white/60 bg-clip-text text-transparent">
              {title}
            </span>
          </h2>
        </AnimatedSection>
        <AnimatedSection delay={0.1}>
          <p className="mx-auto mt-6 max-w-xl text-lg text-white/70 leading-relaxed">{subtitle}</p>
        </AnimatedSection>
        <AnimatedSection delay={0.2}>
          <div className="mt-10 flex justify-center">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
              <Link
                href={ctaHref}
                className="group inline-flex items-center gap-3 rounded-full bg-white px-10 py-4.5 text-base font-semibold text-brand-900 shadow-xl shadow-black/10 hover:bg-brand-50 transition-colors"
              >
                {ctaText}
                <ArrowRight className="h-5 w-5 rtl:rotate-180 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
              </Link>
            </motion.div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
