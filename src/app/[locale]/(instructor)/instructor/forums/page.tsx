"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ThreadList } from "@/components/forums/ThreadList";

interface InstructorCourseOption {
  id: string;
  title: string;
}

export default function InstructorForumsPage() {
  const t = useTranslations("instructor");
  const { user, isLoading: authLoading } = useAuth();

  const [courses, setCourses] = useState<InstructorCourseOption[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCourses() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      const supabase = createClient();
      const { data } = await supabase
        .from("courses")
        .select("id, title")
        .eq("instructor_id", user.id)
        .order("title");

      const courseList = (data ?? []) as InstructorCourseOption[];
      setCourses(courseList);

      if (courseList.length > 0) {
        setSelectedCourseId(courseList[0].id);
      }

      setIsLoading(false);
    }

    if (!authLoading) fetchCourses();
  }, [user, authLoading]);

  if (isLoading || authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">{t("forums")}</h1>

      {/* Course Filter */}
      {courses.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          {courses.map((course) => (
            <Button
              key={course.id}
              variant={selectedCourseId === course.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCourseId(course.id)}
            >
              {course.title}
            </Button>
          ))}
        </div>
      )}

      {/* Thread List */}
      {selectedCourseId ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {t("discussions")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ThreadList courseId={selectedCourseId} />
          </CardContent>
        </Card>
      ) : (
        <div className="py-8 text-center text-sm text-muted-foreground">
          {t("noCourses")}
        </div>
      )}
    </div>
  );
}
