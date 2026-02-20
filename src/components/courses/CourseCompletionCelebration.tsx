"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  Trophy,
  Award,
  Star,
  Sparkles,
  PartyPopper,
  CheckCircle2,
  ArrowRight,
  Download,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface CourseCompletionCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  courseName: string;
  completionPercentage: number;
  certificateEarned?: boolean;
  certificateId?: string;
  examPassed?: boolean;
  examScore?: number;
  nextCourseSlug?: string;
  nextCourseName?: string;
}

// Simple CSS confetti using keyframes (no external library needed)
function ConfettiParticle({
  delay,
  color,
}: {
  delay: number;
  color: string;
}) {
  const randomX = Math.random() * 100;
  const randomDuration = 2 + Math.random() * 2;
  const randomSize = 6 + Math.random() * 8;

  return (
    <div
      className="fixed pointer-events-none z-[60] animate-confetti-fall"
      style={{
        left: `${randomX}vw`,
        width: randomSize,
        height: randomSize * 1.5,
        backgroundColor: color,
        borderRadius: Math.random() > 0.5 ? "50%" : "2px",
        animationDelay: `${delay}s`,
        animationDuration: `${randomDuration}s`,
      }}
    />
  );
}

function ConfettiBurst() {
  const colors = [
    "#1E3A5F",
    "#5391D5",
    "#FFD700",
    "#FF6B6B",
    "#4ECDC4",
    "#9B59B6",
  ];
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    delay: Math.random() * 0.5,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden">
      {particles.map((p) => (
        <ConfettiParticle key={p.id} delay={p.delay} color={p.color} />
      ))}
    </div>
  );
}

export function CourseCompletionCelebration({
  isOpen,
  onClose,
  courseName,
  completionPercentage,
  certificateEarned = false,
  certificateId,
  examPassed,
  examScore,
  nextCourseSlug,
  nextCourseName,
}: CourseCompletionCelebrationProps) {
  const locale = useLocale();
  const t = useTranslations("player");
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {showConfetti && <ConfettiBurst />}

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in zoom-in-95 fade-in">
        <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-card shadow-2xl">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header gradient */}
          <div className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-500 px-8 py-12 text-center text-white">
            {/* Star burst */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute top-1/2 left-1/2 animate-pulse"
                  style={{
                    transform: `rotate(${i * 45}deg) translateY(-80px)`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                >
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                </div>
              ))}
            </div>

            {/* Trophy */}
            <div className="relative mx-auto mb-6 animate-in zoom-in-50 duration-500">
              <div className="flex h-24 w-24 mx-auto items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <Trophy className="h-12 w-12 text-yellow-400" />
              </div>
              <Sparkles className="absolute -right-2 -top-2 h-6 w-6 text-yellow-300 animate-spin" style={{ animationDuration: "10s" }} />
              <Sparkles className="absolute -bottom-1 -left-3 h-5 w-5 text-brand-300 animate-spin" style={{ animationDuration: "8s" }} />
            </div>

            <div className="mb-2 flex items-center justify-center gap-2">
              <PartyPopper className="h-6 w-6" />
              <span className="text-lg font-medium text-white/90">
                {t("congratulations")}
              </span>
              <PartyPopper className="h-6 w-6 scale-x-[-1]" />
            </div>
            <h2 className="text-2xl font-bold md:text-3xl">
              {t("courseComplete")}
            </h2>

            {/* Decorative blurs */}
            <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-300/30 blur-3xl" />
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="mb-6 text-center">
              <h3 className="text-xl font-bold text-foreground">{courseName}</h3>
            </div>

            {/* Stats */}
            <div
              className={cn(
                "mb-6 grid gap-4",
                examPassed !== undefined ? "grid-cols-2" : "grid-cols-1"
              )}
            >
              <div className="rounded-xl bg-muted p-4 text-center">
                <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-500" />
                <p className="text-2xl font-bold text-foreground">
                  {completionPercentage}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("completed")}
                </p>
              </div>

              {examPassed !== undefined && (
                <div className="rounded-xl bg-muted p-4 text-center">
                  <Award
                    className={cn(
                      "mx-auto mb-2 h-8 w-8",
                      examPassed ? "text-emerald-500" : "text-amber-500"
                    )}
                  />
                  <p className="text-2xl font-bold text-foreground">
                    {examScore !== undefined
                      ? `${examScore}%`
                      : examPassed
                        ? "Passed"
                        : "Pending"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("examScore")}
                  </p>
                </div>
              )}
            </div>

            {/* Certificate badge */}
            {certificateEarned && (
              <div className="mb-6 rounded-xl border-2 border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-emerald-500 p-2 text-white">
                    <Award className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                      {t("certificateEarned")}
                    </p>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">
                      {t("certificateReady")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              {certificateEarned && certificateId && (
                <Link
                  href={`/${locale}/dashboard/certificates/${certificateId}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-900 px-6 py-4 font-semibold text-white shadow-lg transition-all hover:bg-brand-800 hover:shadow-xl"
                >
                  <Download className="h-5 w-5" />
                  {t("downloadCertificate")}
                </Link>
              )}

              {nextCourseSlug && nextCourseName && (
                <Link
                  href={`/${locale}/courses/${nextCourseSlug}`}
                  onClick={onClose}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-brand-500 px-6 py-4 font-semibold text-brand-700 transition-colors hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-950/20"
                >
                  {t("startNextCourse", { name: nextCourseName })}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              )}

              <Link
                href={`/${locale}/dashboard`}
                className="block w-full text-center rounded-xl px-6 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
              >
                {t("continueToDashboard")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Hook to manage celebration state
export function useCelebration() {
  const [celebrationData, setCelebrationData] = useState<{
    isOpen: boolean;
    courseName: string;
    completionPercentage: number;
    certificateEarned?: boolean;
    certificateId?: string;
    examPassed?: boolean;
    examScore?: number;
    nextCourseSlug?: string;
    nextCourseName?: string;
  }>({
    isOpen: false,
    courseName: "",
    completionPercentage: 100,
  });

  const triggerCelebration = useCallback(
    (data: Omit<typeof celebrationData, "isOpen">) => {
      setCelebrationData({ ...data, isOpen: true });
    },
    []
  );

  const closeCelebration = useCallback(() => {
    setCelebrationData((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return { celebrationData, triggerCelebration, closeCelebration };
}
