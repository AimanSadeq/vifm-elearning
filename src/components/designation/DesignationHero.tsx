"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Award,
  GraduationCap,
  Users,
  RefreshCw,
  Shield,
} from "lucide-react";
import { AnimatedSection } from "@/components/landing/AnimatedSection";

interface DesignationHeroProps {
  name: string;
  abbreviation: string;
  description: string;
  prerequisites: string[];
  locale: string;
  slug: string;
}

export function DesignationHero({
  name,
  abbreviation,
  description,
  prerequisites,
  locale,
  slug,
}: DesignationHeroProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 text-white">
      {/* Decorative blurred gradient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {!prefersReducedMotion ? (
          <>
            <motion.div
              className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-brand-400/20 blur-3xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-brand-300/15 blur-3xl"
              animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.2, 0.1] }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2,
              }}
            />
          </>
        ) : (
          <>
            <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-brand-400/20 blur-3xl opacity-15" />
            <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-brand-300/15 blur-3xl opacity-10" />
          </>
        )}

        {/* Dot grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="container relative z-10 mx-auto px-4 py-20 sm:py-28 lg:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <AnimatedSection>
            {/* Badge */}
            <motion.div
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-400/10 px-4 py-1.5 text-sm text-brand-200"
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: 10 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Award className="h-4 w-4" />
              {locale === "ar"
                ? "تسمية مهنية من VIFM"
                : "Professional Designation by VIFM"}
            </motion.div>

            {/* Title */}
            <h1 className="font-heading text-4xl font-bold sm:text-5xl lg:text-6xl">
              {name}
            </h1>

            {/* Abbreviation */}
            <p className="mt-3 text-2xl font-semibold text-white/90">
              {abbreviation}
            </p>

            {/* Description */}
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/80">
              {description}
            </p>

            {/* Prerequisites badge */}
            {prerequisites.length > 0 && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm backdrop-blur-sm">
                <Shield className="h-4 w-4" />
                {locale === "ar"
                  ? `يتطلب: ${prerequisites.join(" أو ")}`
                  : `Requires: ${prerequisites.join(" or ")}`}
              </div>
            )}

            {/* CTA buttons */}
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href={`/${locale}/courses`}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-brand-900 shadow-lg shadow-black/10 transition-colors hover:bg-brand-50"
              >
                <GraduationCap className="h-5 w-5" />
                {locale === "ar" ? "احصل على الشهادة" : "Get Certified"}
              </Link>
              <Link
                href={`/${locale}/designations/${slug}/registry`}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10"
              >
                <Users className="h-5 w-5" />
                {locale === "ar" ? "عرض السجل" : "View Registry"}
              </Link>
              <Link
                href={`/${locale}/dashboard/designations/renew`}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10"
              >
                <RefreshCw className="h-5 w-5" />
                {locale === "ar" ? "تجديد" : "Renew"}
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
