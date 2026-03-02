"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight, Landmark, BrainCircuit, Target, ShieldCheck, type LucideIcon } from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  landmark: Landmark,
  "brain-circuit": BrainCircuit,
  target: Target,
  "shield-check": ShieldCheck,
};

interface CategoryCardProps {
  name: string;
  slug: string;
  iconName: string;
  color: string;
  locale: string;
}

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export function CategoryCard({ name, slug, iconName, color, locale }: CategoryCardProps) {
  const Icon = ICON_MAP[iconName] || Landmark;

  return (
    <motion.div variants={cardVariants}>
      <Link href={`/${locale}/categories/${slug}`} className="group block">
        <motion.div
          className="relative overflow-hidden rounded-2xl border border-border/40 bg-white p-8 transition-all duration-500 hover:border-transparent hover:shadow-2xl"
          whileHover={{ y: -6 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {/* Colored top accent bar */}
          <div
            className="absolute inset-x-0 top-0 h-1 transition-all duration-500 group-hover:h-1.5"
            style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }}
          />

          {/* Background glow on hover */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ background: `radial-gradient(circle at 50% 0%, ${color}08, transparent 70%)` }}
          />

          <div className="relative">
            {/* Icon */}
            <div
              className="flex h-14 w-14 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
              style={{ backgroundColor: `${color}10` }}
            >
              <Icon className="h-7 w-7" style={{ color }} />
            </div>

            {/* Name + arrow */}
            <div className="mt-6 flex items-center justify-between">
              <h3 className="font-heading text-lg font-semibold">{name}</h3>
              <ArrowUpRight
                className="h-5 w-5 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
                style={{ color }}
              />
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
