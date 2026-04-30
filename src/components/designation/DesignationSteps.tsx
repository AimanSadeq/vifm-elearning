"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  GraduationCap,
  FileText,
  Award,
  ArrowRight,
} from "lucide-react";
import { AnimatedSection } from "@/components/landing/AnimatedSection";

interface DesignationStepsProps {
  abbreviation: string;
  locale: string;
  /** Deep-link target for the "Start Your Journey" CTA. Falls back to the
   *  catalog when the designation has no 1:1 backing course. */
  primaryCourseSlug?: string | null;
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export function DesignationSteps({
  abbreviation,
  locale,
  primaryCourseSlug,
}: DesignationStepsProps) {
  const startHref = primaryCourseSlug
    ? `/${locale}/courses/${primaryCourseSlug}`
    : `/${locale}/courses`;
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const prefersReducedMotion = useReducedMotion();

  const steps = [
    {
      step: 1,
      icon: BookOpen,
      titleEn: "Enroll",
      titleAr: "التسجيل",
      descEn: `Sign up for the ${abbreviation} certification course on the VIFM eLearning Portal.`,
      descAr: `سجل في دورة شهادة ${abbreviation} على بوابة التعلم الإلكتروني.`,
    },
    {
      step: 2,
      icon: GraduationCap,
      titleEn: "Study",
      titleAr: "الدراسة",
      descEn:
        "Complete all course modules through structured lessons, quizzes, and hands-on labs.",
      descAr:
        "أكمل جميع وحدات الدورة من خلال الدروس والاختبارات والمختبرات العملية.",
    },
    {
      step: 3,
      icon: FileText,
      titleEn: "Pass the Exam",
      titleAr: "اجتياز الامتحان",
      descEn: `Pass the ${abbreviation} certification exam demonstrating mastery across all knowledge areas.`,
      descAr: `اجتز امتحان شهادة ${abbreviation} الذي يثبت إتقانك لجميع مجالات المعرفة.`,
    },
    {
      step: 4,
      icon: Award,
      titleEn: "Get Certified",
      titleAr: "الحصول على الشهادة",
      descEn: `Receive your ${abbreviation} certificate, digital badge, and listing on the public registry.`,
      descAr: `احصل على شهادة ${abbreviation} والشارة الرقمية والإدراج في السجل العام.`,
    },
  ];

  return (
    <section>
      <AnimatedSection>
        <div className="text-center">
          <h2 className="font-heading text-3xl font-bold">
            {locale === "ar"
              ? "كيف تحصل على الشهادة"
              : "How to Get Certified"}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {locale === "ar"
              ? `أربع خطوات لتصبح محترف ${abbreviation}`
              : `Four steps to becoming a ${abbreviation} professional`}
          </p>
        </div>
      </AnimatedSection>

      <motion.div
        ref={ref}
        className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        variants={prefersReducedMotion ? undefined : containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        {steps.map((step) => {
          const title = locale === "ar" ? step.titleAr : step.titleEn;
          const desc = locale === "ar" ? step.descAr : step.descEn;

          return (
            <motion.div
              key={step.step}
              className="relative rounded-2xl border bg-card p-6 text-center shadow-sm"
              variants={cardVariants}
              whileHover={prefersReducedMotion ? undefined : { y: -4 }}
            >
              {/* Step number badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white shadow-sm">
                {step.step}
              </div>

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50">
                <step.icon className="h-8 w-8 text-brand-600" />
              </div>

              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {desc}
              </p>
            </motion.div>
          );
        })}
      </motion.div>

      <AnimatedSection delay={0.3}>
        <div className="mt-10 text-center">
          <Link
            href={startHref}
            className="group inline-flex items-center gap-2 rounded-full bg-brand-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition-colors hover:bg-brand-700"
          >
            {locale === "ar" ? "ابدأ رحلتك" : "Start Your Journey"}
            <ArrowRight className="h-5 w-5 rtl:rotate-180 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
          </Link>
        </div>
      </AnimatedSection>
    </section>
  );
}
