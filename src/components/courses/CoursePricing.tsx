"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ShieldCheck, Award, Clock, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/formatters";
import { useAuth } from "@/lib/hooks/useAuth";
import type { Course, Enrollment } from "@/types";

interface CoursePricingProps {
  course: Course;
  enrollment?: Enrollment | null;
}

export function CoursePricing({ course, enrollment }: CoursePricingProps) {
  const t = useTranslations("courses");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuth();
  const [isEnrolling, setIsEnrolling] = useState(false);

  const handleEnroll = async () => {
    if (!user) {
      router.push(`/${locale}/login`);
      return;
    }

    if (enrollment) {
      // Already enrolled — go to course
      router.push(`/${locale}/courses/${course.slug}/learn`);
      return;
    }

    // Admins bypass checkout and enroll directly
    const isAdmin = user.role === "super_admin";

    if (course.is_free || isAdmin) {
      // Enroll directly (free course or admin bypass)
      setIsEnrolling(true);
      try {
        const res = await fetch("/api/enrollments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseId: course.id }),
        });
        const { error } = await res.json();
        if (error) {
          alert(error);
          return;
        }
        router.push(`/${locale}/courses/${course.slug}/learn`);
      } finally {
        setIsEnrolling(false);
      }
    } else {
      // Redirect to checkout for paid course
      router.push(`/${locale}/courses/${course.slug}/checkout`);
    }
  };

  const buttonText = enrollment
    ? t("continueLearning")
    : course.is_free
      ? tc("enrollNow")
      : tc("enrollNow");

  return (
    <Card className="sticky top-20">
      <CardContent className="p-6">
        {/* Price */}
        <div className="mb-4 text-center">
          {course.is_free ? (
            <span className="text-3xl font-bold text-success">{t("free")}</span>
          ) : (
            <span className="text-3xl font-bold">
              {formatCurrency(course.price, course.currency, locale)}
            </span>
          )}
        </div>

        {/* Enroll button */}
        <Button
          className="w-full"
          size="lg"
          onClick={handleEnroll}
          disabled={isEnrolling}
        >
          {isEnrolling && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
          {buttonText}
        </Button>

        {/* Course includes */}
        <div className="mt-6 space-y-3">
          <p className="text-sm font-medium">This course includes:</p>

          {course.duration_hours != null && course.duration_hours > 0 && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 shrink-0" />
              <span>
                {course.duration_hours} {t("hours")} of content
              </span>
            </div>
          )}

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <BookOpen className="h-4 w-4 shrink-0" />
            <span>Full lifetime access</span>
          </div>

          {course.certificate_enabled && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Award className="h-4 w-4 shrink-0" />
              <span>Certificate of completion</span>
            </div>
          )}

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>30-day money-back guarantee</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
