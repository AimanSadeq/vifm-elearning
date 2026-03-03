"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { AnimatedSection } from "./AnimatedSection";
import { cn } from "@/lib/utils/cn";

export interface Testimonial {
  id: string;
  name: string;
  name_ar?: string;
  role: string;
  role_ar?: string;
  company?: string;
  company_ar?: string;
  quote: string;
  quote_ar?: string;
  avatar_url?: string;
  designation?: string;
  rating: number;
}

interface TestimonialsCarouselProps {
  testimonials: Testimonial[];
  locale: string;
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

// Generate a consistent color from a string
function stringToColor(str: string): string {
  const colors = [
    "bg-brand-600",
    "bg-blue-600",
    "bg-emerald-600",
    "bg-violet-600",
    "bg-amber-600",
    "bg-rose-600",
    "bg-cyan-600",
    "bg-indigo-600",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i < rating
              ? "fill-amber-400 text-amber-400"
              : "fill-muted text-muted"
          )}
        />
      ))}
    </div>
  );
}

export function TestimonialsCarousel({
  testimonials,
  locale,
}: TestimonialsCarouselProps) {
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

  const totalPages = Math.ceil(testimonials.length / itemsPerPage);

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
    }, 5000);
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [currentPage, isPaused, prefersReducedMotion, totalPages, goToPage]);

  const visibleTestimonials = testimonials.slice(
    currentPage * itemsPerPage,
    currentPage * itemsPerPage + itemsPerPage
  );

  if (testimonials.length === 0) return null;

  return (
    <section className="py-20 lg:py-28">
      <div className="container mx-auto px-4">
        <AnimatedSection>
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-400">
              {locale === "ar" ? "ماذا يقول المتعلمون" : "What Our Learners Say"}
            </p>
            <h2 className="mt-3 font-heading text-3xl font-bold lg:text-4xl xl:text-5xl">
              {locale === "ar" ? "قصص النجاح" : "Success Stories"}
            </h2>
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
              {visibleTestimonials.map((testimonial) => {
                const displayName =
                  locale === "ar" && testimonial.name_ar
                    ? testimonial.name_ar
                    : testimonial.name;
                const displayRole =
                  locale === "ar" && testimonial.role_ar
                    ? testimonial.role_ar
                    : testimonial.role;
                const displayCompany =
                  locale === "ar" && testimonial.company_ar
                    ? testimonial.company_ar
                    : testimonial.company;
                const displayQuote =
                  locale === "ar" && testimonial.quote_ar
                    ? testimonial.quote_ar
                    : testimonial.quote;
                const avatarColor = stringToColor(testimonial.name);

                return (
                  <motion.div
                    key={testimonial.id}
                    className="group relative flex flex-col rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-lg"
                    variants={cardVariants}
                  >
                    {/* Quote icon */}
                    <Quote className="absolute right-6 top-6 h-8 w-8 text-brand-100 dark:text-brand-900/30" />

                    {/* Rating */}
                    <StarRating rating={testimonial.rating} />

                    {/* Quote text */}
                    <p
                      className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground"
                      dir={locale === "ar" ? "rtl" : "ltr"}
                    >
                      &ldquo;{displayQuote}&rdquo;
                    </p>

                    {/* Divider */}
                    <div className="my-5 h-px bg-border" />

                    {/* Author */}
                    <div className="flex items-center gap-3">
                      {testimonial.avatar_url ? (
                        <img
                          src={testimonial.avatar_url}
                          alt={displayName}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
                            avatarColor
                          )}
                        >
                          {getInitials(testimonial.name)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {displayName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {displayRole}
                          {displayCompany ? `, ${displayCompany}` : ""}
                        </p>
                      </div>
                      {testimonial.designation && (
                        <span className="ms-auto shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                          {testimonial.designation}
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
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
