"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import Link from "next/link";
import { AnimatedSection } from "./AnimatedSection";
import { CourseCard } from "@/components/courses/CourseCard";
import { cn } from "@/lib/utils/cn";
import type { Course } from "@/types";

interface FeaturedCoursesSectionProps {
  courses: Course[];
  locale: string;
  sectionTitle: string;
  sectionSubtitle: string;
  viewAllText: string;
  viewAllHref: string;
}

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

export function FeaturedCoursesSection({
  courses,
  locale,
  sectionTitle,
  sectionSubtitle,
  viewAllText,
  viewAllHref,
}: FeaturedCoursesSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [mounted, setMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const prefersReducedMotion =
    mounted && typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : true;

  // Responsive items per page
  const [itemsPerPage, setItemsPerPage] = useState(3);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 640) setItemsPerPage(1);
      else if (window.innerWidth < 1024) setItemsPerPage(2);
      else setItemsPerPage(3);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const totalPages = Math.ceil(courses.length / itemsPerPage);

  const goToPage = useCallback(
    (page: number) => {
      setCurrentPage((page + totalPages) % totalPages);
    },
    [totalPages]
  );

  // Auto-play
  useEffect(() => {
    if (prefersReducedMotion || isPaused || totalPages <= 1) return;
    autoPlayRef.current = setInterval(() => {
      goToPage(currentPage + 1);
    }, 6000);
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [currentPage, isPaused, prefersReducedMotion, totalPages, goToPage]);

  const visibleCourses = courses.slice(
    currentPage * itemsPerPage,
    currentPage * itemsPerPage + itemsPerPage
  );

  if (courses.length === 0) return null;

  return (
    <section className={sectionTitle ? "py-20 lg:py-28" : "pb-20 lg:pb-28"}>
      <div className="container mx-auto px-4">
        <AnimatedSection>
          <div className="text-center">
            {/* Internal header — skipped when the parent renders a SectionMarker */}
            {sectionTitle && (
              <>
                <p className="text-sm font-semibold uppercase tracking-widest text-brand-400">
                  {sectionSubtitle}
                </p>
                <h2 className="mt-3 font-heading text-3xl font-bold lg:text-4xl xl:text-5xl">
                  {sectionTitle}
                </h2>
              </>
            )}
            <Link
              href={viewAllHref}
              className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
            >
              {viewAllText}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </div>
        </AnimatedSection>

        {/* Carousel */}
        <div
          className="relative mt-14"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Navigation Arrows */}
          {totalPages > 1 && (
            <>
              <button
                onClick={() => goToPage(currentPage - 1)}
                className="absolute -left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border bg-background p-2 shadow-md transition-colors hover:bg-muted lg:-left-5"
                aria-label={locale === "ar" ? "السابق" : "Previous"}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => goToPage(currentPage + 1)}
                className="absolute -right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border bg-background p-2 shadow-md transition-colors hover:bg-muted lg:-right-5"
                aria-label={locale === "ar" ? "التالي" : "Next"}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Cards Grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              ref={ref}
              className={cn(
                "grid gap-6",
                itemsPerPage === 1 && "grid-cols-1",
                itemsPerPage === 2 && "grid-cols-2",
                itemsPerPage === 3 && "grid-cols-3"
              )}
              variants={prefersReducedMotion ? undefined : containerVariants}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
            >
              {visibleCourses.map((course) => (
                <motion.div
                  key={course.id}
                  className="h-full"
                  variants={cardVariants}
                >
                  <CourseCard course={course} />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Dot indicators */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => goToPage(i)}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    i === currentPage
                      ? "w-8 bg-brand-600"
                      : "w-2 bg-brand-200 hover:bg-brand-300 dark:bg-brand-800 dark:hover:bg-brand-700"
                  )}
                  aria-label={`Page ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
