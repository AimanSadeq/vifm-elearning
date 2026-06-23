"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  Languages,
  Video,
  FileCheck,
  BarChart3,
  BadgeCheck,
  BrainCircuit,
  type LucideIcon,
} from "lucide-react";
import { AnimatedSection } from "./AnimatedSection";
import { cn } from "@/lib/utils/cn";

interface PlatformFeature {
  id: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
}

const FEATURES: PlatformFeature[] = [
  {
    id: "bilingual",
    icon: Languages,
    color: "text-sky-600",
    bgColor: "bg-sky-50 dark:bg-sky-950/40",
    borderColor: "border-sky-200 dark:border-sky-800",
  },
  {
    id: "videoLearning",
    icon: Video,
    color: "text-rose-600",
    bgColor: "bg-rose-50 dark:bg-rose-950/40",
    borderColor: "border-rose-200 dark:border-rose-800",
  },
  {
    id: "quizzes",
    icon: BrainCircuit,
    color: "text-violet-600",
    bgColor: "bg-violet-50 dark:bg-violet-950/40",
    borderColor: "border-violet-200 dark:border-violet-800",
  },
  {
    id: "cpeTracking",
    icon: BarChart3,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
    borderColor: "border-emerald-200 dark:border-emerald-800",
  },
  {
    id: "certificates",
    icon: BadgeCheck,
    color: "text-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-950/40",
    borderColor: "border-amber-200 dark:border-amber-800",
  },
  {
    id: "assessments",
    icon: FileCheck,
    color: "text-brand-600",
    bgColor: "bg-brand-50 dark:bg-brand-950/40",
    borderColor: "border-brand-200 dark:border-brand-800",
  },
];

interface PlatformFeaturesProps {
  sectionTitle: string;
  sectionSubtitle: string;
  features: {
    id: string;
    title: string;
    description: string;
    highlights: string[];
  }[];
}

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const detailVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2 } },
};

export function PlatformFeatures({
  sectionTitle,
  sectionSubtitle,
  features: featureData,
}: PlatformFeaturesProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [mounted, setMounted] = useState(false);
  // Only render features that the caller actually passed data for — the
  // hardcoded FEATURES list just supplies the icons.
  const visibleFeatures = FEATURES.filter((f) =>
    featureData.some((d) => d.id === f.id)
  );
  const [activeId, setActiveId] = useState(
    visibleFeatures[0]?.id ?? FEATURES[0].id
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const prefersReducedMotion =
    mounted && typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : true;

  const activeFeature =
    visibleFeatures.find((f) => f.id === activeId) ??
    visibleFeatures[0] ??
    FEATURES[0];
  const activeData =
    featureData.find((f) => f.id === activeFeature.id) ?? featureData[0];
  const ActiveIcon = activeFeature.icon;

  return (
    <section className={sectionTitle ? "py-16 lg:py-24" : "pb-16 lg:pb-24"}>
      <div className="container mx-auto px-4">
        {/* Internal header — skipped when the parent renders a SectionMarker */}
        {sectionTitle && (
          <AnimatedSection>
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-brand-400">
                {sectionSubtitle}
              </p>
              <h2 className="mt-3 font-heading text-3xl font-bold lg:text-4xl xl:text-5xl">
                {sectionTitle}
              </h2>
            </div>
          </AnimatedSection>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.2fr] lg:gap-12">
          {/* Feature selector — left column */}
          <motion.div
            ref={ref}
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 lg:gap-4"
            variants={prefersReducedMotion ? undefined : containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            {visibleFeatures.map((feature) => {
              const Icon = feature.icon;
              const data = featureData.find((f) => f.id === feature.id);
              const isActive = activeId === feature.id;

              return (
                <motion.button
                  key={feature.id}
                  variants={cardVariants}
                  onClick={() => setActiveId(feature.id)}
                  className={cn(
                    "group relative flex flex-col items-start gap-3 rounded-xl border p-4 text-start transition-all duration-200 lg:p-5",
                    isActive
                      ? cn(feature.bgColor, feature.borderColor, "shadow-md")
                      : "border-border/50 bg-background hover:border-border hover:shadow-sm"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                      isActive
                        ? cn(feature.bgColor, feature.color)
                        : "bg-secondary text-muted-foreground group-hover:text-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span
                    className={cn(
                      "text-sm font-semibold transition-colors",
                      isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  >
                    {data?.title ?? feature.id}
                  </span>

                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="platformActiveIndicator"
                      className={cn("absolute inset-0 rounded-xl border-2", feature.borderColor)}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </motion.div>

          {/* Feature detail — right column */}
          <div className="relative min-h-[320px] lg:min-h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeId}
                variants={prefersReducedMotion ? undefined : detailVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className={cn(
                  "rounded-2xl border p-8 lg:p-10",
                  activeFeature.bgColor,
                  activeFeature.borderColor
                )}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "flex h-14 w-14 items-center justify-center rounded-xl",
                      activeFeature.color,
                      "bg-white/80 dark:bg-white/10"
                    )}
                  >
                    <ActiveIcon className="h-7 w-7" />
                  </div>
                  <h3 className="font-heading text-2xl font-bold lg:text-3xl">
                    {activeData.title}
                  </h3>
                </div>

                <p className="mt-5 text-base leading-relaxed text-muted-foreground lg:text-lg">
                  {activeData.description}
                </p>

                {/* Highlights list */}
                <ul className="mt-6 space-y-3">
                  {activeData.highlights.map((highlight, i) => (
                    <motion.li
                      key={i}
                      initial={prefersReducedMotion ? false : { opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.06 }}
                      className="flex items-start gap-3"
                    >
                      <span
                        className={cn(
                          "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold",
                          activeFeature.color.replace("text-", "bg-")
                        )}
                      >
                        ✓
                      </span>
                      <span className="text-sm text-foreground/80 lg:text-base">
                        {highlight}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
