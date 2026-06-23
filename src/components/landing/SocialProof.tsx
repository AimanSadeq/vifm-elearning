"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { AnimatedSection } from "./AnimatedSection";
import { Users, BookOpen, TrendingUp, Building2, Globe } from "lucide-react";

interface Stat {
  value: number;
  suffix: string;
  label: string;
}

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const prefersReducedMotion =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  useEffect(() => {
    if (!isInView) return;
    if (prefersReducedMotion) { setCount(value); return; }
    const duration = 2000;
    const start = performance.now();
    function tick(t: number) {
      const p = Math.min((t - start) / duration, 1);
      setCount(Math.floor((1 - Math.pow(1 - p, 3)) * value));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [isInView, value, prefersReducedMotion]);

  return <span ref={ref} className="tabular-nums">{count.toLocaleString()}{suffix}</span>;
}

const STAT_ICONS = [Users, BookOpen, TrendingUp, Building2, Globe];

interface SocialProofProps {
  sectionTitle: string;
  stats: Stat[];
  sectionSubtitle: string;
}

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

export function SocialProof({ sectionTitle, stats, sectionSubtitle }: SocialProofProps) {
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
    <section className="relative overflow-hidden bg-secondary/30 py-20 lg:py-28">

      <div className="container relative mx-auto px-4">
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

        {/* Stats grid */}
        <motion.div
          ref={ref}
          className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 lg:gap-6"
          variants={prefersReducedMotion ? undefined : containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {stats.map((stat, i) => {
            const Icon = STAT_ICONS[i] || Users;
            return (
              <motion.div
                key={i}
                className="group relative overflow-hidden rounded-2xl border border-border/50 bg-background p-6 lg:p-8 shadow-sm transition-colors hover:shadow-md"
                variants={cardVariants}
                whileHover={{ y: -4 }}
              >
                {/* Accent corner glow */}
                <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-brand-400/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative">
                  <Icon className="h-6 w-6 text-brand-400 mb-4" />
                  <div className="text-5xl font-bold text-foreground lg:text-6xl">
                    <Counter value={stat.value} suffix={stat.suffix} />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

      </div>
    </section>
  );
}
