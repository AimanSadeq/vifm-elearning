"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Users, BookOpen, TrendingUp, Building2, type LucideIcon } from "lucide-react";

interface Stat {
  value: number;
  suffix: string;
  label: string;
}

const STAT_ICONS: LucideIcon[] = [Users, BookOpen, TrendingUp, Building2];
const CYCLE_MS = 3000;

export function StatsBar({ stats }: { stats: Stat[] }) {
  const [active, setActive] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const prefersReducedMotion =
    mounted && typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : true;

  useEffect(() => {
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % stats.length);
    }, CYCLE_MS);
    return () => clearInterval(id);
  }, [stats.length]);

  const Icon = STAT_ICONS[active] || Users;
  const stat = stats[active];

  return (
    <motion.div
      className="relative overflow-hidden rounded-full border border-white/10 bg-white/[0.05] backdrop-blur-xl"
      initial={mounted && !prefersReducedMotion ? { opacity: 0, y: -20 } : false}
      animate={mounted && !prefersReducedMotion ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
    >
      {/* Subtle shimmer line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-400/40 to-transparent" />

      <div className="flex items-center justify-center gap-3 px-6 py-3">
        {/* Dot indicators */}
        <div className="flex items-center gap-1.5">
          {stats.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === active
                  ? "w-5 bg-brand-400"
                  : "w-1.5 bg-white/20 hover:bg-white/40"
              }`}
              aria-label={`Show stat ${i + 1}`}
            />
          ))}
        </div>

        {/* Divider */}
        <div className="h-4 w-px bg-white/10" />

        {/* Animated stat */}
        <div className="relative h-6 flex items-center overflow-hidden min-w-[260px] justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              className="flex items-center gap-2.5"
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -16 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <Icon className="h-4 w-4 text-brand-400 shrink-0" />
              <span className="text-sm font-bold text-white tabular-nums">
                {stat.value.toLocaleString()}{stat.suffix}
              </span>
              <span className="text-sm text-brand-300/70 font-medium">
                {stat.label}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
