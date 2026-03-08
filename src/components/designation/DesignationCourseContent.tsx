"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useInView,
  useReducedMotion,
} from "framer-motion";
import {
  Table2,
  Database,
  RefreshCw,
  BarChart3,
  ChevronDown,
  PlayCircle,
  Clock,
  Users,
  Target,
  Info,
} from "lucide-react";
import { AnimatedSection } from "@/components/landing/AnimatedSection";
import { cn } from "@/lib/utils/cn";
import { createClient } from "@/lib/supabase/client";
import {
  courseContentRegistry,
  type CourseModule,
} from "@/data/course-content";
import type { Module, Lesson } from "@/types";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface DesignationCourseContentProps {
  slug: string;
  locale: string;
  designationId?: string;
}

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Objective icons                                                    */
/* ------------------------------------------------------------------ */

const objectiveIcons = [Table2, Database, RefreshCw, BarChart3];

/* ------------------------------------------------------------------ */
/*  Module color palette (cycles)                                      */
/* ------------------------------------------------------------------ */

const moduleColors = [
  { color: "text-brand-600", bg: "bg-brand-50", border: "border-brand-200" },
  { color: "text-info", bg: "bg-info/10", border: "border-info/20" },
  { color: "text-success", bg: "bg-success/10", border: "border-success/20" },
  { color: "text-accent-600", bg: "bg-accent-50", border: "border-accent-200" },
];

/* ------------------------------------------------------------------ */
/*  Module Accordion                                                   */
/* ------------------------------------------------------------------ */

function ModuleAccordion({
  mod,
  index,
  isOpen,
  onToggle,
  locale,
  prefersReducedMotion,
}: {
  mod: CourseModule;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  locale: string;
  prefersReducedMotion: boolean | null;
}) {
  const palette = moduleColors[index % moduleColors.length];
  const title = locale === "ar" ? mod.title.ar : mod.title.en;
  const videoCount = mod.videos.length;

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-4 p-5 text-start transition-colors hover:bg-muted/30"
      >
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            palette.bg
          )}
        >
          <span className={cn("text-sm font-bold", palette.color)}>
            {mod.id}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-heading font-semibold">{title}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {videoCount} {locale === "ar" ? "فيديو" : "videos"}
          </p>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={
              prefersReducedMotion
                ? { opacity: 1 }
                : { height: 0, opacity: 0 }
            }
            animate={
              prefersReducedMotion
                ? { opacity: 1 }
                : { height: "auto", opacity: 1 }
            }
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { height: 0, opacity: 0 }
            }
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="border-t px-5 pb-5 pt-4">
              <motion.div
                className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
                variants={prefersReducedMotion ? undefined : containerVariants}
                initial="hidden"
                animate="visible"
              >
                {mod.videos.map((video) => {
                  const vTitle =
                    locale === "ar" ? video.title.ar : video.title.en;
                  const vDesc =
                    locale === "ar" ? video.desc.ar : video.desc.en;

                  return (
                    <motion.div
                      key={video.num}
                      className="group rounded-xl border bg-background p-4 transition-all hover:shadow-md"
                      variants={cardVariants}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold",
                            palette.bg,
                            palette.color
                          )}
                        >
                          <PlayCircle className="h-3 w-3" />
                          {video.num}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {video.duration}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold leading-snug">
                        {vTitle}
                      </h4>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {vDesc}
                      </p>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

/**
 * Converts DB modules + lessons into the static CourseModule format
 * so the same ModuleAccordion component can render both sources.
 */
function dbModulesToCourseModules(
  modules: (Module & { lessons: Lesson[] })[]
): CourseModule[] {
  return modules.map((mod, i) => ({
    id: i + 1,
    title: {
      en: mod.title,
      ar: mod.title_ar || mod.title,
    },
    videos: mod.lessons
      .filter((l) => l.content_type === "video")
      .map((l, j) => ({
        num: `${i + 1}.${j + 1}`,
        title: {
          en: l.title,
          ar: l.title_ar || l.title,
        },
        desc: {
          en: l.description || "",
          ar: l.description_ar || l.description || "",
        },
        duration: l.video_duration_seconds
          ? `${Math.floor(l.video_duration_seconds / 60)}:${String(
              l.video_duration_seconds % 60
            ).padStart(2, "0")}`
          : `${l.duration_minutes} min`,
      })),
  }));
}

export function DesignationCourseContent({
  slug,
  locale,
  designationId,
}: DesignationCourseContentProps) {
  const data = courseContentRegistry[slug];
  const [openModule, setOpenModule] = useState<number | null>(0);
  const [dbModules, setDbModules] = useState<CourseModule[] | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const objectivesRef = useRef(null);
  const objectivesInView = useInView(objectivesRef, {
    once: true,
    margin: "-60px",
  });
  const competenciesRef = useRef(null);
  const competenciesInView = useInView(competenciesRef, {
    once: true,
    margin: "-60px",
  });

  // Fetch DB modules/lessons for the linked course (if any)
  const fetchLinkedCourse = useCallback(async () => {
    if (!designationId) return;

    try {
      const supabase = createClient();

      // Find a published course linked to this designation
      const { data: course } = await supabase
        .from("courses")
        .select("id")
        .eq("designation_id", designationId)
        .eq("status", "published")
        .limit(1)
        .single();

      if (!course) return;

      // Fetch modules with their lessons
      const { data: modulesData } = await supabase
        .from("modules")
        .select("*, lessons(*)")
        .eq("course_id", course.id)
        .order("sort_order", { ascending: true });

      if (modulesData && modulesData.length > 0) {
        // Sort lessons within each module
        const sorted = modulesData.map(
          (m: Module & { lessons: Lesson[] }) => ({
            ...m,
            lessons: (m.lessons || []).sort(
              (a: Lesson, b: Lesson) => a.sort_order - b.sort_order
            ),
          })
        ) as (Module & { lessons: Lesson[] })[];

        // Only use DB modules if they have at least one video lesson
        const hasVideos = sorted.some((m) =>
          m.lessons.some((l) => l.content_type === "video")
        );

        if (hasVideos) {
          setDbModules(dbModulesToCourseModules(sorted));
        }
      }
    } catch (err) {
      console.error("[DesignationCourseContent] fetch failed:", err);
    }
  }, [designationId]);

  useEffect(() => {
    fetchLinkedCourse();
  }, [fetchLinkedCourse]);

  if (!data) return null;

  const t = (bi: { en: string; ar: string }) =>
    locale === "ar" ? bi.ar : bi.en;

  // Use DB modules if available, otherwise fall back to static registry
  const modulesToRender = dbModules ?? data.modules;

  return (
    <div className="space-y-16">
      {/* ── Objectives ──────────────────────────────────────── */}
      <AnimatedSection>
        <section>
          <div className="text-center">
            <h2 className="font-heading text-3xl font-bold">
              {t(data.objectivesTitle)}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {t(data.objectivesIntro)}
            </p>
          </div>

          <motion.div
            ref={objectivesRef}
            className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2"
            variants={prefersReducedMotion ? undefined : containerVariants}
            initial="hidden"
            animate={objectivesInView ? "visible" : "hidden"}
          >
            {data.objectives.map((obj, i) => {
              const Icon = objectiveIcons[i % objectiveIcons.length];
              return (
                <motion.div
                  key={i}
                  className="rounded-2xl border bg-card p-6 shadow-sm"
                  variants={cardVariants}
                  whileHover={
                    prefersReducedMotion ? undefined : { y: -4 }
                  }
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
                    <Icon className="h-6 w-6 text-brand-600" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold">
                    {t(obj.title)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t(obj.desc)}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </section>
      </AnimatedSection>

      {/* ── Target Audience ─────────────────────────────────── */}
      <AnimatedSection>
        <section className="mx-auto max-w-3xl text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
              <Users className="h-6 w-6 text-brand-600" />
            </div>
          </div>
          <h2 className="font-heading text-3xl font-bold">
            {t(data.audienceTitle)}
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            {t(data.audienceDesc)}
          </p>
        </section>
      </AnimatedSection>

      {/* ── Target Competencies ─────────────────────────────── */}
      <AnimatedSection>
        <section>
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
                <Target className="h-6 w-6 text-brand-600" />
              </div>
            </div>
            <h2 className="font-heading text-3xl font-bold">
              {t(data.competenciesTitle)}
            </h2>
          </div>

          <motion.div
            ref={competenciesRef}
            className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
            variants={prefersReducedMotion ? undefined : containerVariants}
            initial="hidden"
            animate={competenciesInView ? "visible" : "hidden"}
          >
            {data.competencies.map((comp, i) => (
              <motion.div
                key={i}
                className="rounded-xl border bg-card px-4 py-3 text-center shadow-sm"
                variants={cardVariants}
              >
                <span className="text-sm font-medium">{t(comp.text)}</span>
              </motion.div>
            ))}
          </motion.div>
        </section>
      </AnimatedSection>

      {/* ── Course Content (Modules Accordion) ──────────────── */}
      <AnimatedSection>
        <section>
          <div className="text-center">
            <h2 className="font-heading text-3xl font-bold">
              {t(data.contentTitle)}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {t(data.contentSubtitle)}
            </p>
          </div>

          {data.prerequisiteNote && (
            <div className="mx-auto mt-6 flex max-w-2xl items-start gap-3 rounded-xl border border-info/20 bg-info/5 p-4">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-info" />
              <p className="text-sm text-muted-foreground">
                {t(data.prerequisiteNote)}
              </p>
            </div>
          )}

          <div className="mt-8 space-y-3">
            {modulesToRender.map((mod, i) => (
              <ModuleAccordion
                key={mod.id}
                mod={mod}
                index={i}
                isOpen={openModule === i}
                onToggle={() =>
                  setOpenModule(openModule === i ? null : i)
                }
                locale={locale}
                prefersReducedMotion={prefersReducedMotion}
              />
            ))}
          </div>
        </section>
      </AnimatedSection>
    </div>
  );
}
