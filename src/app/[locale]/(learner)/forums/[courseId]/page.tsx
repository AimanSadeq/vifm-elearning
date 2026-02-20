"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { MessageSquare, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ThreadList } from "@/components/forums/ThreadList";

export default function LearnerForumPage() {
  const t = useTranslations("forums");
  const { user, isLoading: authLoading } = useAuth();
  const params = useParams();
  const courseId = params.courseId as string;

  const [isEnrolled, setIsEnrolled] = useState(false);
  const [courseTitle, setCourseTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkEnrollment() {
      if (!user || !courseId) {
        setIsLoading(false);
        return;
      }

      const supabase = createClient();

      const [enrollmentRes, courseRes] = await Promise.all([
        supabase
          .from("enrollments")
          .select("id")
          .eq("user_id", user.id)
          .eq("course_id", courseId)
          .maybeSingle(),
        supabase
          .from("courses")
          .select("title")
          .eq("id", courseId)
          .single(),
      ]);

      setIsEnrolled(!!enrollmentRes.data);
      setCourseTitle(courseRes.data?.title ?? "");
      setIsLoading(false);
    }

    if (!authLoading) checkEnrollment();
  }, [user, authLoading, courseId]);

  if (isLoading || authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isEnrolled) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">
          You must be enrolled in this course to access the discussion forum.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">
        {t("discussions")}
        {courseTitle && (
          <span className="text-muted-foreground font-normal text-lg ms-2">
            — {courseTitle}
          </span>
        )}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {t("discussions")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ThreadList courseId={courseId} />
        </CardContent>
      </Card>
    </div>
  );
}
