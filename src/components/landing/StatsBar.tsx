"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

interface Stat {
  value: number;
  suffix: string;
  label: string;
}

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!isInView) return;
    if (prefersReducedMotion) { setCount(value); return; }
    const duration = 1800;
    const start = performance.now();
    function tick(t: number) {
      const p = Math.min((t - start) / duration, 1);
      setCount(Math.floor((1 - Math.pow(1 - p, 3)) * value));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [isInView, value, prefersReducedMotion]);

  return <span ref={ref} className="tabular-nums">{count}{suffix}</span>;
}

export function StatsBar({ stats }: { stats: Stat[] }) {
  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 1.1, ease: "easeOut" }}
    >
      {/* Top gradient line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-400/50 to-transparent" />

      <div className="grid grid-cols-2 gap-0 sm:grid-cols-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className={`flex flex-col items-center py-6 px-4 lg:py-8 ${
              i < stats.length - 1 ? "border-r border-white/[0.06] rtl:border-r-0 rtl:border-l rtl:border-white/[0.06]" : ""
            } ${i === 1 ? "max-sm:border-r-0 max-sm:rtl:border-l-0" : ""} ${i >= 2 ? "max-sm:border-t max-sm:border-white/[0.06]" : ""}`}
          >
            <span className="text-2xl font-bold text-white lg:text-3xl">
              <AnimatedCounter value={stat.value} suffix={stat.suffix} />
            </span>
            <span className="mt-1.5 text-xs text-brand-300/60 font-medium uppercase tracking-wider">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
