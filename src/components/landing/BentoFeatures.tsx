"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { GraduationCap, Clock, Award, Building2, type LucideIcon } from "lucide-react";
import { AnimatedSection } from "./AnimatedSection";
import { cn } from "@/lib/utils/cn";

const FEATURE_ICONS: Record<string, LucideIcon> = {
  "graduation-cap": GraduationCap,
  clock: Clock,
  award: Award,
  building2: Building2,
};

const CARD_CONFIG = [
  {
    grid: "sm:col-span-2 sm:row-span-2",
    bg: "bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 text-white",
    iconBg: "bg-white/10",
    iconColor: "text-brand-300",
    descColor: "text-brand-200/80",
    iconSize: "h-10 w-10",
    titleSize: "text-2xl lg:text-3xl",
    padding: "p-8 lg:p-12",
    accent: true,
  },
  {
    grid: "",
    bg: "bg-white",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    descColor: "text-muted-foreground",
    iconSize: "h-6 w-6",
    titleSize: "text-lg",
    padding: "p-6 lg:p-8",
    accent: false,
  },
  {
    grid: "",
    bg: "bg-white",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    descColor: "text-muted-foreground",
    iconSize: "h-6 w-6",
    titleSize: "text-lg",
    padding: "p-6 lg:p-8",
    accent: false,
  },
  {
    grid: "sm:col-span-2",
    bg: "bg-gradient-to-r from-brand-50 to-blue-50",
    iconBg: "bg-brand-100",
    iconColor: "text-brand-600",
    descColor: "text-muted-foreground",
    iconSize: "h-7 w-7",
    titleSize: "text-xl",
    padding: "p-6 lg:p-8",
    accent: false,
  },
];

interface Feature {
  iconName: string;
  title: string;
  description: string;
}

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

export function BentoFeatures({ features, sectionTitle, sectionSubtitle }: { features: Feature[]; sectionTitle: string; sectionSubtitle: string }) {
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

  return (
    <div>
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

      <motion.div
        ref={ref}
        className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        variants={prefersReducedMotion ? undefined : containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        {features.map((feature, i) => {
          const config = CARD_CONFIG[i] || CARD_CONFIG[1];
          const Icon = FEATURE_ICONS[feature.iconName] || GraduationCap;

          return (
            <motion.div
              key={feature.title}
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-border/40 transition-all duration-300 hover:shadow-xl",
                config.grid,
                config.bg,
                config.padding
              )}
              variants={cardVariants}
              whileHover={{ y: -4 }}
            >
              {/* Decorative element for the large card */}
              {config.accent && (
                <div className="absolute -right-8 -bottom-8 h-40 w-40 rounded-full bg-brand-400/10 blur-2xl" />
              )}

              <div className="relative">
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", config.iconBg)}>
                  <Icon className={cn(config.iconColor, config.iconSize)} />
                </div>
                <h3 className={cn("mt-5 font-heading font-bold", config.titleSize)}>
                  {feature.title}
                </h3>
                <p className={cn("mt-3 leading-relaxed", config.descColor)}>
                  {feature.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
