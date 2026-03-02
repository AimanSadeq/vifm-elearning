"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function HeroBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const prefersReducedMotion =
    mounted && typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : true;

  const animate = mounted && !prefersReducedMotion;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Large animated gradient orbs */}
      <motion.div
        className="absolute -top-40 right-0 h-[700px] w-[700px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(83,145,213,0.25) 0%, transparent 70%)" }}
        animate={animate ? { x: [0, 60, 0], y: [0, 40, 0], scale: [1, 1.1, 1] } : undefined}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/3 -left-40 h-[500px] w-[500px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(83,145,213,0.15) 0%, transparent 70%)" }}
        animate={animate ? { x: [0, 40, 0], y: [0, -30, 0] } : undefined}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-20 right-1/4 h-[400px] w-[400px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)" }}
        animate={animate ? { x: [0, -50, 0], y: [0, -20, 0] } : undefined}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Geometric grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Decorative rings */}
      <div className="absolute top-20 right-[10%] h-72 w-72 rounded-full border border-white/[0.06] hidden lg:block" />
      <div className="absolute top-32 right-[12%] h-56 w-56 rounded-full border border-white/[0.04] hidden lg:block" />
      <div className="absolute bottom-32 left-[5%] h-40 w-40 rounded-full border border-brand-400/10 hidden lg:block" />

      {/* Glowing dots */}
      <motion.div
        className="absolute top-[20%] right-[20%] h-2 w-2 rounded-full bg-brand-400/60"
        animate={animate ? { opacity: [0.3, 1, 0.3], scale: [1, 1.5, 1] } : undefined}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-[60%] right-[30%] h-1.5 w-1.5 rounded-full bg-brand-400/40"
        animate={animate ? { opacity: [0.2, 0.8, 0.2], scale: [1, 1.3, 1] } : undefined}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <motion.div
        className="absolute top-[40%] right-[15%] h-2.5 w-2.5 rounded-full bg-white/20"
        animate={animate ? { opacity: [0.2, 0.6, 0.2], scale: [1, 1.4, 1] } : undefined}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
    </div>
  );
}
