"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { AnimatedSection } from "@/components/landing/AnimatedSection";

interface FAQItem {
  question: string;
  questionAr: string;
  answer: string;
  answerAr: string;
}

interface DesignationFAQProps {
  items: FAQItem[];
  locale: string;
}

export function DesignationFAQ({ items, locale }: DesignationFAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  if (items.length === 0) return null;

  return (
    <AnimatedSection>
      <section className="mx-auto max-w-3xl">
        <h2 className="mb-8 text-center font-heading text-3xl font-bold">
          {locale === "ar"
            ? "الأسئلة الشائعة"
            : "Frequently Asked Questions"}
        </h2>

        <div className="space-y-3">
          {items.map((item, index) => {
            const question =
              locale === "ar" ? item.questionAr : item.question;
            const answer = locale === "ar" ? item.answerAr : item.answer;
            const isOpen = openIndex === index;

            return (
              <div
                key={index}
                className="overflow-hidden rounded-xl border bg-card/80 shadow-sm"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between p-5 text-start"
                >
                  <span className="pe-4 font-medium">{question}</span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={
                        prefersReducedMotion
                          ? { opacity: 1 }
                          : { height: 0, opacity: 0 }
                      }
                      animate={
                        prefersReducedMotion
                          ? { opacity: 1 }
                          : { height: "auto", opacity: 1 }
                      }
                      exit={
                        prefersReducedMotion
                          ? { opacity: 0 }
                          : { height: 0, opacity: 0 }
                      }
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="border-t px-5 py-4">
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>
    </AnimatedSection>
  );
}
