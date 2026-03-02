"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { AnimatedSection } from "@/components/landing/AnimatedSection";

interface DesignationCTAProps {
  abbreviation: string;
  slug: string;
  locale: string;
}

export function DesignationCTA({
  abbreviation,
  slug,
  locale,
}: DesignationCTAProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden rounded-2xl py-16 sm:py-20">
      {/* Animated gradient background */}
      <div
        className={`absolute inset-0 bg-gradient-to-br from-brand-800 via-brand-600 to-brand-400 ${
          prefersReducedMotion ? "" : "animate-gradient-shift"
        }`}
      />

      {/* Decorative elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {!prefersReducedMotion && (
          <>
            <motion.div
              className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-white/10 blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.15, 0.1],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-white/10 blur-3xl"
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.08, 0.12, 0.08],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2,
              }}
            />
          </>
        )}

        {/* Dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="container relative z-10 mx-auto px-4 text-center text-white">
        <AnimatedSection>
          <h2 className="font-heading text-3xl font-bold lg:text-4xl">
            {locale === "ar"
              ? "هل أنت مستعد لرفع مسيرتك المهنية؟"
              : "Ready to Elevate Your Career?"}
          </h2>
        </AnimatedSection>

        <AnimatedSection delay={0.1}>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
            {locale === "ar"
              ? `انضم إلى مجتمع متنامٍ من محترفي ${abbreviation} المعتمدين. أثبت خبرتك. تميز عن الآخرين.`
              : `Join a growing community of certified ${abbreviation} professionals. Prove your expertise. Stand out from the crowd.`}
          </p>
        </AnimatedSection>

        <AnimatedSection delay={0.2}>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <motion.div
              whileHover={
                prefersReducedMotion ? undefined : { scale: 1.04 }
              }
              whileTap={
                prefersReducedMotion ? undefined : { scale: 0.97 }
              }
            >
              <Link
                href={`/${locale}/courses`}
                className="group inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-brand-900 shadow-lg shadow-black/10 transition-colors hover:bg-brand-50"
              >
                {locale === "ar" ? "ابدأ الآن" : "Get Started"}
                <ArrowRight className="h-4 w-4 rtl:rotate-180 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
              </Link>
            </motion.div>
            <motion.div
              whileHover={
                prefersReducedMotion ? undefined : { scale: 1.04 }
              }
              whileTap={
                prefersReducedMotion ? undefined : { scale: 0.97 }
              }
            >
              <Link
                href={`/${locale}/designations/${slug}/registry`}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10"
              >
                {locale === "ar" ? "تصفح السجل" : "Browse the Registry"}
              </Link>
            </motion.div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
