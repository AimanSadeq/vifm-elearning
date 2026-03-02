"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { BookOpen } from "lucide-react";
import { AnimatedSection } from "@/components/landing/AnimatedSection";

interface DesignationDocument {
  id: string;
  title: string;
  title_ar: string | null;
  description: string | null;
  sort_order: number;
}

interface DesignationModulesProps {
  documents: DesignationDocument[];
  locale: string;
}

const moduleColors = [
  { color: "text-brand-600", bg: "bg-brand-50" },
  { color: "text-info", bg: "bg-info/10" },
  { color: "text-success", bg: "bg-success/10" },
  { color: "text-accent-600", bg: "bg-accent-50" },
  { color: "text-purple-600", bg: "bg-purple-50" },
  { color: "text-orange-600", bg: "bg-orange-50" },
  { color: "text-rose-600", bg: "bg-rose-50" },
  { color: "text-teal-600", bg: "bg-teal-50" },
  { color: "text-indigo-600", bg: "bg-indigo-50" },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
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

export function DesignationModules({
  documents,
  locale,
}: DesignationModulesProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const prefersReducedMotion = useReducedMotion();

  if (documents.length === 0) return null;

  return (
    <section>
      <AnimatedSection>
        <div className="text-center">
          <h2 className="font-heading text-3xl font-bold">
            {locale === "ar" ? "وحدات المنهج" : "Course Modules"}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {locale === "ar"
              ? `${documents.length} وحدات تغطي المنهج الكامل`
              : `${documents.length} modules covering the full body of knowledge`}
          </p>
        </div>
      </AnimatedSection>

      <motion.div
        ref={ref}
        className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        variants={prefersReducedMotion ? undefined : containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        {documents.map((doc, i) => {
          const palette = moduleColors[i % moduleColors.length];
          const title =
            locale === "ar" && doc.title_ar ? doc.title_ar : doc.title;

          return (
            <motion.div
              key={doc.id}
              className="group relative rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-xl"
              variants={cardVariants}
              whileHover={prefersReducedMotion ? undefined : { y: -4 }}
            >
              {/* Module number badge */}
              <div className="absolute -top-2 right-4 rtl:right-auto rtl:left-4 flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white shadow-sm">
                {i + 1}
              </div>

              <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${palette.bg}`}
              >
                <BookOpen className={`h-6 w-6 ${palette.color}`} />
              </div>
              <h3 className="font-semibold">{title}</h3>
              {doc.description && (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {doc.description}
                </p>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
