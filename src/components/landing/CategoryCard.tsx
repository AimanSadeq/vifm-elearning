"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Landmark, BrainCircuit, Target, ShieldCheck, type LucideIcon } from "lucide-react";

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
  locale: string;
}

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

export function CategoryCard({ name, description, slug, iconName, color, locale }: CategoryCardProps) {
  const Icon = ICON_MAP[iconName] || Landmark;

  return (
    <motion.div variants={cardVariants}>
      <Link href={`/${locale}/categories/${slug}`} className="group block h-full">
        <motion.div
          className="relative h-full overflow-hidden rounded-2xl p-6 lg:p-8 transition-all duration-500 hover:shadow-2xl"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}CC)` }}
          whileHover={{ y: -6 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {/* Dot pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)",
              backgroundSize: "20px 20px",
            }}
          />

          {/* Corner glow on hover */}
          <div className="absolute -top-12 -end-12 h-32 w-32 rounded-full bg-white/0 blur-2xl transition-all duration-500 group-hover:bg-white/10" />
          <div className="absolute -bottom-8 -start-8 h-24 w-24 rounded-full bg-white/0 blur-2xl transition-all duration-500 group-hover:bg-white/5" />

          <div className="relative flex h-full flex-col">
            {/* Icon */}
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
              <Icon className="h-7 w-7 text-white" />
            </div>

            {/* Name */}
            <h3 className="mt-5 font-heading text-xl font-bold text-white">
              {name}
            </h3>

            {/* Description */}
            {description && (
              <p className="mt-2 flex-1 text-sm leading-relaxed text-white/70">
                {description}
              </p>
            )}

            {/* Browse arrow */}
            <div className="mt-4 flex items-center gap-1.5 text-sm font-medium text-white/80 transition-colors group-hover:text-white">
              <ArrowRight className="h-4 w-4 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 rtl:rotate-180 rtl:translate-x-1 rtl:group-hover:translate-x-0" />
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
