"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

interface GlowButtonProps {
  children: React.ReactNode;
  href: string;
  className?: string;
}

export function GlowButton({ children, href, className }: GlowButtonProps) {
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
    <motion.div className="relative inline-flex" whileHover={animate ? { scale: 1.03 } : undefined} whileTap={animate ? { scale: 0.98 } : undefined}>
      <motion.div
        className="absolute inset-0 rounded-xl bg-brand-400/40 blur-xl"
        animate={animate ? { scale: [1, 1.2, 1], opacity: [0.4, 0.6, 0.4] } : undefined}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <Link
        href={href}
        className={cn(
          "relative inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-brand-900 shadow-lg hover:bg-brand-50 transition-colors",
          className
        )}
      >
        {children}
      </Link>
    </motion.div>
  );
}
