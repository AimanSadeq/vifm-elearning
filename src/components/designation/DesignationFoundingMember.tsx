"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Star, CheckCircle2 } from "lucide-react";
import { AnimatedSection } from "@/components/landing/AnimatedSection";

interface DesignationFoundingMemberProps {
  abbreviation: string;
  foundingFee: number;
  locale: string;
}

export function DesignationFoundingMember({
  abbreviation,
  foundingFee,
  locale,
}: DesignationFoundingMemberProps) {
  const prefersReducedMotion = useReducedMotion();

  const benefits = [
    {
      text: "No re-examination required",
      textAr: "لا يلزم إعادة الامتحان",
    },
    {
      text: "Founding Member designation on certificate and registry",
      textAr: "تسمية عضو مؤسس على الشهادة والسجل",
    },
    {
      text: "Free access to VIFM e-Learning Portal",
      textAr: "وصول مجاني إلى بوابة التعلم الإلكتروني",
    },
    {
      text: `Discounted first-year renewal: $${foundingFee} USD`,
      textAr: `تجديد مخفض للسنة الأولى: ${foundingFee} دولار`,
    },
    {
      text: "Priority registration for all VIFM programs",
      textAr: "تسجيل ذو أولوية لجميع برامج VIFM",
    },
    {
      text: `Listed in the official ${abbreviation} Registry`,
      textAr: `مدرج في سجل ${abbreviation} الرسمي`,
    },
  ];

  return (
    <AnimatedSection>
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-900 via-amber-800 to-amber-950 p-8 text-white sm:p-12">
        {/* Dot pattern overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative flex flex-col items-center text-center lg:flex-row lg:items-start lg:gap-12 lg:text-start">
          {/* Star icon with pulse */}
          <div className="mb-6 shrink-0 lg:mb-0">
            <motion.div
              className="flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-700/50"
              animate={
                prefersReducedMotion
                  ? undefined
                  : { scale: [1, 1.1, 1] }
              }
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Star className="h-10 w-10 text-amber-300" />
            </motion.div>
          </div>

          <div className="flex-1">
            {/* LIMITED TIME badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-300">
              {locale === "ar" ? "وقت محدود" : "LIMITED TIME"}
            </div>

            <h2 className="mt-3 font-heading text-3xl font-bold">
              {locale === "ar"
                ? "وضع العضو المؤسس"
                : "Founding Member Status"}
            </h2>

            <p className="mt-3 leading-relaxed text-amber-200/80">
              {locale === "ar"
                ? `حالة نخبوية للمحترفين الذين حصلوا على شهادة ${abbreviation} في مراحلها الأولى. لن يتم تقديم هذه الحالة مرة أخرى للمرشحين المستقبليين.`
                : `Elite status for professionals who earned the ${abbreviation} in its early stages. This status will never be offered again to future candidates.`}
            </p>

            <ul className="mt-6 space-y-3">
              {benefits.map((benefit) => {
                const text =
                  locale === "ar" ? benefit.textAr : benefit.text;
                return (
                  <li
                    key={benefit.text}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                    <span className="text-amber-200/90">{text}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>
    </AnimatedSection>
  );
}
