"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { CategoryCard } from "./CategoryCard";
import { AnimatedSection } from "./AnimatedSection";

interface Category {
  name: string;
  slug: string;
  iconName: string;
  color: string;
}

interface CategoriesGridProps {
  categories: Category[];
  locale: string;
  title: string;
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

export function CategoriesGrid({ categories, locale, title }: CategoriesGridProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
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
        <h2 className="font-heading text-3xl font-bold text-center lg:text-4xl">
          {title}
        </h2>
      </AnimatedSection>

      <motion.div
        ref={ref}
        className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        variants={prefersReducedMotion ? undefined : containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        {categories.map((cat) => (
          <CategoryCard
            key={cat.slug}
            name={cat.name}
            slug={cat.slug}
            iconName={cat.iconName}
            color={cat.color}
            locale={locale}
          />
        ))}
      </motion.div>
    </div>
  );
}
