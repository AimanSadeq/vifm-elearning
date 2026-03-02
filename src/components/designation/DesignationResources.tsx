"use client";

import { useState, useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { MonitorPlay, PenTool, Users, Eye, FileText } from "lucide-react";
import { AnimatedSection } from "@/components/landing/AnimatedSection";
import { cn } from "@/lib/utils/cn";
import type { DesignationResource } from "@/types";

interface DesignationResourcesProps {
  resources: DesignationResource[];
  locale: string;
  abbreviation: string;
}

type FilterValue = "all" | "presentation" | "exercise" | "workshop";

const filterTabs: { value: FilterValue; labelEn: string; labelAr: string }[] = [
  { value: "all", labelEn: "All", labelAr: "الكل" },
  { value: "presentation", labelEn: "Presentations", labelAr: "العروض التقديمية" },
  { value: "exercise", labelEn: "Exercises", labelAr: "التمارين" },
  { value: "workshop", labelEn: "Workshops", labelAr: "ورش العمل" },
];

const typeIcons: Record<string, typeof MonitorPlay> = {
  presentation: MonitorPlay,
  exercise: PenTool,
  workshop: Users,
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

export function DesignationResources({
  resources,
  locale,
  abbreviation,
}: DesignationResourcesProps) {
  const [activeFilter, setActiveFilter] = useState<FilterValue>("all");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const prefersReducedMotion = useReducedMotion();

  const filtered =
    activeFilter === "all"
      ? resources
      : resources.filter((r) => r.resource_type === activeFilter);

  return (
    <section>
      <AnimatedSection>
        <div className="text-center">
          <h2 className="font-heading text-3xl font-bold">
            {locale === "ar" ? "مواد الدورة" : "Course Materials"}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {locale === "ar"
              ? `الموارد التعليمية لبرنامج ${abbreviation}`
              : `Learning resources for the ${abbreviation} program`}
          </p>
        </div>

        {/* Filter tabs */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab.value;
            const label = locale === "ar" ? tab.labelAr : tab.labelEn;

            return (
              <button
                key={tab.value}
                onClick={() => {
                  setActiveFilter(tab.value);
                  setPreviewUrl(null);
                }}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-brand-600 text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </AnimatedSection>

      {/* Resource grid */}
      {filtered.length > 0 ? (
        <motion.div
          ref={ref}
          className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2"
          variants={prefersReducedMotion ? undefined : containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          key={activeFilter}
        >
          {filtered.map((resource) => {
            const Icon = typeIcons[resource.resource_type] || FileText;
            const title =
              locale === "ar" && resource.title_ar
                ? resource.title_ar
                : resource.title;
            const description =
              locale === "ar" && resource.description_ar
                ? resource.description_ar
                : resource.description;
            const isPdf =
              resource.file_url && resource.file_type === "application/pdf";
            const isShowingPreview = previewUrl === resource.file_url;

            return (
              <motion.div
                key={resource.id}
                className="rounded-xl border bg-card p-6 shadow-sm"
                variants={cardVariants}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50">
                    <Icon className="h-5 w-5 text-brand-600" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold">{title}</h3>
                    {description && (
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {description}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {/* File type badge */}
                      {resource.file_type && (
                        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600">
                          {resource.file_type
                            .replace("application/", "")
                            .toUpperCase()}
                        </span>
                      )}

                      {/* View button */}
                      {resource.file_url && (
                        <button
                          onClick={() => {
                            if (isPdf) {
                              setPreviewUrl(
                                isShowingPreview ? null : resource.file_url
                              );
                            } else {
                              window.open(resource.file_url!, "_blank");
                            }
                          }}
                          className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:bg-muted"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          {locale === "ar" ? "عرض" : "View"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Inline PDF preview */}
                {isPdf && isShowingPreview && resource.file_url && (
                  <iframe
                    src={resource.file_url}
                    className="mt-4 w-full rounded-lg border"
                    style={{ height: "500px" }}
                    title={title}
                  />
                )}
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        /* Empty state */
        <div className="mt-12 flex flex-col items-center justify-center py-12 text-center">
          {activeFilter !== "all" && (
            <>
              {(() => {
                const EmptyIcon = typeIcons[activeFilter] || FileText;
                return (
                  <EmptyIcon className="h-12 w-12 text-muted-foreground/30" />
                );
              })()}
              <p className="mt-4 text-muted-foreground">
                {locale === "ar"
                  ? `لا توجد ${
                      activeFilter === "presentation"
                        ? "عروض تقديمية"
                        : activeFilter === "exercise"
                          ? "تمارين"
                          : "ورش عمل"
                    } متاحة بعد`
                  : `No ${activeFilter}s available yet`}
              </p>
            </>
          )}
          {activeFilter === "all" && (
            <>
              <FileText className="h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-muted-foreground">
                {locale === "ar"
                  ? "لا توجد موارد متاحة بعد"
                  : "No resources available yet"}
              </p>
            </>
          )}
        </div>
      )}
    </section>
  );
}
