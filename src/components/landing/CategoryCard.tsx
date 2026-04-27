"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  Landmark,
  BrainCircuit,
  Target,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  landmark: Landmark,
  "brain-circuit": BrainCircuit,
  target: Target,
  "shield-check": ShieldCheck,
};

interface CategoryCardProps {
  name: string;
  description?: string;
  slug: string;
  iconName: string;
  color: string;
  /** Optional explicit index (1-based). Used for the floating "01/02/03/04"
   *  number on each card — gives the grid a rhythmic editorial feel. */
  index?: number;
  locale: string;
}

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

export function CategoryCard({
  name,
  description,
  slug,
  iconName,
  index,
  locale,
}: CategoryCardProps) {
  const Icon = ICON_MAP[iconName] || Landmark;

  return (
    <motion.div variants={cardVariants}>
      <Link href={`/${locale}/categories/${slug}`} className="group block h-full">
        <motion.div
          className="relative h-full overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-500 hover:border-brand-300 hover:shadow-xl lg:p-8"
          whileHover={{ y: -6 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {/* Subtle brand wash on hover */}
          <div
            aria-hidden
            className="absolute inset-0 -z-0 bg-gradient-to-br from-brand-50/0 to-brand-50/0 transition-all duration-500 group-hover:from-brand-50/60 dark:group-hover:from-brand-950/30"
          />

          {/* Floating index — sits in the top-end corner like a magazine number */}
          {index !== undefined && (
            <span className="absolute end-5 top-5 font-heading text-xs font-medium tabular-nums text-brand-600/40">
              {String(index).padStart(2, "0")}
            </span>
          )}

          <div className="relative flex h-full flex-col">
            {/* Icon plate — brand-tinted, matches the detail-page benefit cards */}
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-all duration-300 group-hover:bg-brand-600 group-hover:text-white dark:bg-brand-950/40 dark:text-brand-300 dark:group-hover:bg-brand-500">
              <Icon className="h-6 w-6" />
            </div>

            <h3 className="mt-5 font-heading text-xl font-bold tracking-tight">
              {name}
            </h3>

            {description && (
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            )}

            {/* Browse arrow — subtle until hover */}
            <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition-all">
              <span>{locale === "ar" ? "استكشف" : "Browse"}</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
