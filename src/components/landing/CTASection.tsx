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
    <section className="relative overflow-hidden py-24 lg:py-32">
      {/* Animated gradient background */}
      <div
        className={`absolute inset-0 bg-gradient-to-br from-brand-800 via-brand-600 to-brand-400 ${
          animate ? "animate-gradient-shift" : ""
        }`}
      />

      {/* Decorative elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-white/10 blur-3xl"
          animate={animate ? { scale: [1, 1.2, 1], opacity: [0.1, 0.15, 0.1] } : undefined}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-white/10 blur-3xl"
          animate={animate ? { scale: [1, 1.15, 1], opacity: [0.08, 0.12, 0.08] } : undefined}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        {/* Dot pattern */}
        <div className="absolute inset-0 opacity-[0.05]" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }} />
      </div>

      <div className="container relative z-10 mx-auto px-4 text-center text-white">
        <AnimatedSection>
          <h2 className="font-heading text-3xl font-bold lg:text-5xl xl:text-6xl">
            {title}
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
