"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  GraduationCap,
  Briefcase,
  Crown,
} from "lucide-react";
import Link from "next/link";
import { AnimatedSection } from "./AnimatedSection";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import type { Designation } from "@/types";
import type { LucideIcon } from "lucide-react";

interface CertificationProgramsSectionProps {
  designations: Designation[];
  locale: string;
  sectionTitle: string;
  sectionSubtitle: string;
  viewAllText: string;
  viewAllHref: string;
}

const TIER_CONFIG: Record<
  string,
  {
    label: string;
    labelAr: string;
    icon: LucideIcon;
    badgeColor: string;
    accentColor: string;
    borderHover: string;
  }
> = {
  gateway: {
    label: "Gateway",
    labelAr: "تأسيسي",
    icon: GraduationCap,
    badgeColor:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
    accentColor: "bg-emerald-600",
    borderHover: "hover:border-emerald-300 dark:hover:border-emerald-700",
  },
  professional: {
    label: "Professional",
    labelAr: "مهني",
    icon: Briefcase,
    badgeColor:
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    accentColor: "bg-blue-600",
    borderHover: "hover:border-blue-300 dark:hover:border-blue-700",
  },
  executive: {
    label: "Executive",
    labelAr: "تنفيذي",
    icon: Crown,
    badgeColor:
      "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    accentColor: "bg-amber-600",
    borderHover: "hover:border-amber-300 dark:hover:border-amber-700",
  },
};

const TIER_ORDER = ["gateway", "professional", "executive"];

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

export function CertificationProgramsSection({
  designations,
  locale,
  sectionTitle,
  sectionSubtitle,
  viewAllText,
  viewAllHref,
}: CertificationProgramsSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const prefersReducedMotion =
    mounted && typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : true;

  if (designations.length === 0) return null;

  const grouped = TIER_ORDER.map((tier) => ({
    tier,
    items: designations.filter((d) => d.metadata?.tier_level === tier),
  })).filter((g) => g.items.length > 0);

  // When the parent renders a SectionMarker above, sectionTitle is "" — in
  // that case skip our own header to avoid 200px of dead space and trim the
  // top padding accordingly.
  const hasOwnHeader = Boolean(sectionTitle);

  return (
    <section
      className={cn(
        "bg-secondary/30",
        hasOwnHeader ? "py-20 lg:py-28" : "pb-16 pt-6 lg:pb-24 lg:pt-8"
      )}
    >
      <div className="container mx-auto px-4">
        {hasOwnHeader && (
          <AnimatedSection>
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-brand-400">
                {sectionSubtitle}
              </p>
              <h2 className="mt-3 font-heading text-3xl font-bold lg:text-4xl xl:text-5xl">
                {sectionTitle}
              </h2>
              <Link
                href={viewAllHref}
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
              >
                {viewAllText}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </div>
          </AnimatedSection>
        )}

        {/* Tier groups */}
        <div
          ref={ref}
          className={cn(
            "space-y-10",
            hasOwnHeader ? "mt-14" : "mt-2"
          )}
        >
          {grouped.map(({ tier, items }) => {
            const config = TIER_CONFIG[tier];
            if (!config) return null;
            const Icon = config.icon;

            return (
              <div key={tier}>
                {/* Tier header */}
                <div className="mb-4 flex items-center gap-2">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg",
                      config.accentColor
                    )}
                  >
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold">
                    {locale === "ar" ? config.labelAr : config.label}
                  </h3>
                  <Badge className={config.badgeColor}>
                    {items.length}
                  </Badge>
                </div>

                {/* Scrollable cards row */}
                <motion.div
                  className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
                  variants={
                    prefersReducedMotion ? undefined : containerVariants
                  }
                  initial="hidden"
                  animate={isInView ? "visible" : "hidden"}
                >
                  {items.map((d) => {
                    const name =
                      locale === "ar" && d.name_ar ? d.name_ar : d.name;
                    const desc =
                      locale === "ar" && d.description_ar
                        ? d.description_ar
                        : d.description;

                    return (
                      <motion.div
                        key={d.id}
                        className="snap-start shrink-0 w-[280px] sm:w-[300px]"
                        variants={cardVariants}
                      >
                        <Link
                          href={`/${locale}/designations/${d.slug}`}
                          className="block h-full"
                        >
                          <Card
                            className={cn(
                              "group h-full transition-all hover:shadow-lg",
                              config.borderHover
                            )}
                          >
                            {/* Accent bar */}
                            <div
                              className={cn("h-1 rounded-t-xl", config.accentColor)}
                            />
                            <CardContent className="flex h-full flex-col p-5">
                              {/* Abbreviation + Fee */}
                              <div className="mb-3 flex items-center justify-between">
                                <span className="inline-flex items-center justify-center rounded-lg bg-brand-100 px-3 py-1.5 text-sm font-bold text-brand-700 dark:bg-brand-900 dark:text-brand-300">
                                  {d.abbreviation}
                                </span>
                                <span className="text-sm font-medium text-muted-foreground">
                                  {d.founding_fee === 0
                                    ? locale === "ar"
                                      ? "مجاني"
                                      : "Free"
                                    : `$${d.founding_fee}`}
                                </span>
                              </div>

                              {/* Name */}
                              <h4 className="font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
                                {name}
                              </h4>

                              {/* Description */}
                              {desc && (
                                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-2">
                                  {desc}
                                </p>
                              )}

                              {/* Meta tags */}
                              <div className="mt-3 flex flex-wrap gap-1.5">
                                {d.metadata?.tier_level && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] font-medium"
                                  >
                                    {locale === "ar"
                                      ? config.labelAr
                                      : config.label}
                                  </Badge>
                                )}
                                {d.annual_cpe_required > 0 && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] font-medium"
                                  >
                                    {d.annual_cpe_required} CPE/
                                    {locale === "ar" ? "سنة" : "yr"}
                                  </Badge>
                                )}
                                {d.metadata?.prerequisites &&
                                  d.metadata.prerequisites.length > 0 && (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] font-medium"
                                    >
                                      {locale === "ar"
                                        ? "متطلبات مسبقة"
                                        : "Prerequisites"}
                                    </Badge>
                                  )}
                              </div>

                              {/* CTA */}
                              <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">
                                {locale === "ar"
                                  ? "عرض التفاصيل"
                                  : "View Details"}
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>
            );
          })}
        </div>

        {/* When the parent renders the section title above (hasOwnHeader=false),
            the "View all" link lives at the bottom right so it isn't orphaned. */}
        {!hasOwnHeader && (
          <div className="mt-10 flex justify-center">
            <Link
              href={viewAllHref}
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
            >
              {viewAllText}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
