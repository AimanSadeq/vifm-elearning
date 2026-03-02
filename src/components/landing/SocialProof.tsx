"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { AnimatedSection } from "./AnimatedSection";
import { Users, BookOpen, TrendingUp, Building2 } from "lucide-react";

interface Stat {
  value: number;
  suffix: string;
  label: string;
}

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const prefersReducedMotion = useReducedMotion();

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

  return <span ref={ref} className="tabular-nums">{count}{suffix}</span>;
}

const STAT_ICONS = [Users, BookOpen, TrendingUp, Building2];

const PARTNERS = ["CFA Institute", "CISI", "CAIA", "GARP", "IFQ", "BIBF"];

interface SocialProofProps {
  sectionTitle: string;
  stats: Stat[];
  sectionSubtitle: string;
  recognizedBy: string;
}

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

export function SocialProof({ sectionTitle, stats, sectionSubtitle, recognizedBy }: SocialProofProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-brand-950 py-20 lg:py-28 text-white">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)",
        backgroundSize: "40px 40px",
      }} />

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
          className="mt-14 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6"
          variants={prefersReducedMotion ? undefined : containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {stats.map((stat, i) => {
            const Icon = STAT_ICONS[i] || Users;
            return (
              <motion.div
                key={i}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 lg:p-8 backdrop-blur-sm transition-colors hover:bg-white/[0.06]"
                variants={cardVariants}
                whileHover={{ y: -4 }}
              >
                {/* Accent corner glow */}
                <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-brand-400/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative">
                  <Icon className="h-6 w-6 text-brand-400 mb-4" />
                  <div className="text-4xl font-bold text-white lg:text-5xl">
                    <Counter value={stat.value} suffix={stat.suffix} />
                  </div>
                  <p className="mt-2 text-sm text-brand-300/70">{stat.label}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Partner logos */}
        <AnimatedSection delay={0.3}>
          <div className="mt-16">
            <p className="text-center text-xs font-medium uppercase tracking-widest text-brand-400/50 mb-8">
              {recognizedBy}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-10">
              {PARTNERS.map((name) => (
                <div
                  key={name}
                  className="rounded-full border border-white/[0.06] bg-white/[0.02] px-6 py-2.5 text-sm font-medium text-brand-300/40 transition-colors hover:text-brand-300/70 hover:border-white/10"
                >
                  {name}
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
