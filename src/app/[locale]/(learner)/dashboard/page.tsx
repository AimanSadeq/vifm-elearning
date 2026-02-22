"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { BookOpen, Award, TrendingUp, Clock, PlayCircle, Video, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { RecommendationCard } from "@/components/recommendations/RecommendationCard";

interface DashboardStats {
  inProgress: number;
  completed: number;
  certificates: number;
  overallProgress: number;
}

import { formatDate, formatDuration } from "@/lib/utils/formatters";

interface MyWebinar {
  id: string;
  title: string;
  title_ar?: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
}

interface RecommendationData {
  courseId: string;
  title: string;
  titleAr?: string | null;
  slug: string;
  thumbnailUrl?: string | null;
  price: number;
  currency: string;
  isFree: boolean;
  averageRating: number;
  enrollmentCount: number;
  reason: string;
}

interface ContinueCourse {
  enrollment_id: string;
  progress_percentage: number;
  course_slug: string;
  course_title: string;
  course_title_ar?: string;
  course_thumbnail?: string;
}

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const { user, isLoading: authLoading } = useAuth();

  const [stats, setStats] = useState<DashboardStats>({
    inProgress: 0,
    completed: 0,
    certificates: 0,
    overallProgress: 0,
  });
  const [continueCourses, setContinueCourses] = useState<ContinueCourse[]>([]);
  const [myWebinars, setMyWebinars] = useState<MyWebinar[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      const supabase = createClient();

      // Fetch enrollments
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select(
          `
          id,
          status,
          progress_percentage,
          course:courses!enrollments_course_id_fkey(
            slug, title, title_ar, thumbnail_url
          )
        `
        )
        .eq("user_id", user.id);

      // Fetch certificates count
      const { count: certCount } = await supabase
        .from("certificates")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "issued");

      const enrollmentList = (enrollments ?? []) as unknown as Array<{
        id: string;
        status: string;
        progress_percentage: number;
        course: {
          slug: string;
          title: string;
          title_ar?: string;
          thumbnail_url?: string;
        };
      }>;

      const inProgress = enrollmentList.filter(
        (e) => e.status === "active"
      ).length;
      const completed = enrollmentList.filter(
        (e) => e.status === "completed"
      ).length;
      const totalProgress =
        enrollmentList.length > 0
          ? enrollmentList.reduce(
              (sum, e) => sum + (e.progress_percentage || 0),
              0
            ) / enrollmentList.length
          : 0;

      setStats({
        inProgress,
        completed,
        certificates: certCount ?? 0,
        overallProgress: Math.round(totalProgress),
      });

      // Continue learning - active enrollments sorted by most recent
      const active = enrollmentList
        .filter((e) => e.status === "active" && e.progress_percentage < 100)
        .slice(0, 3)
        .map((e) => ({
          enrollment_id: e.id,
          progress_percentage: e.progress_percentage,
          course_slug: e.course.slug,
          course_title: e.course.title,
          course_title_ar: e.course.title_ar,
          course_thumbnail: e.course.thumbnail_url,
        }));

      setContinueCourses(active);

      // Fetch upcoming registered webinars
      const { data: registrations } = await supabase
        .from("webinar_registrations")
        .select(
          `
          webinar:webinars!webinar_registrations_webinar_id_fkey(
            id, title, title_ar, scheduled_at, duration_minutes, status
          )
        `
        )
        .eq("user_id", user.id);

      const webinarList = (registrations ?? [])
        .map((r) => (r as unknown as { webinar: MyWebinar }).webinar)
        .filter((w) => w && (w.status === "scheduled" || w.status === "live"))
        .slice(0, 3);

      setMyWebinars(webinarList);

      // Fetch recommendations
      try {
        const res = await fetch("/api/recommendations?limit=4");
        if (res.ok) {
          const { data: recs } = await res.json();
          setRecommendations(recs ?? []);
        }
      } catch {
        // Silently fail - recommendations are non-critical
      }

      setIsLoading(false);
    }

    if (!authLoading) fetchDashboard();
  }, [user, authLoading]);

  if (isLoading || authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const statCards = [
    {
      icon: BookOpen,
      label: t("coursesInProgress"),
      value: stats.inProgress.toString(),
      color: "text-info",
      bg: "bg-info/10",
    },
    {
      icon: Award,
      label: t("coursesCompleted"),
      value: stats.completed.toString(),
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      icon: TrendingUp,
      label: t("certificatesEarned"),
      value: stats.certificates.toString(),
      color: "text-accent-600",
      bg: "bg-accent-50",
    },
    {
      icon: Clock,
      label: t("overallProgress"),
      value: `${stats.overallProgress}%`,
      color: "text-brand-600",
      bg: "bg-brand-50",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">
        {t("welcome", { name: user?.full_name || user?.email?.split("@")[0] || "" })}
      </h1>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-6">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full ${stat.bg}`}
              >
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Continue Learning */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("continueLearning")}</CardTitle>
        </CardHeader>
        <CardContent>
          {continueCourses.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-muted-foreground">{t("noCourses")}</p>
              <Link href={`/${locale}/courses`}>
                <Button className="mt-4">{t("browseCourses")}</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {continueCourses.map((course) => {
                const title =
                  locale === "ar" && course.course_title_ar
                    ? course.course_title_ar
                    : course.course_title;

                return (
                  <Link
                    key={course.enrollment_id}
                    href={`/${locale}/courses/${course.course_slug}/learn`}
                    className="flex items-center gap-4 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="h-16 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                      {course.course_thumbnail ? (
                        <Image
                          src={course.course_thumbnail}
                          alt={title}
                          width={96}
                          height={64}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <BookOpen className="h-6 w-6 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{title}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Progress
                          value={course.progress_percentage}
                          className="h-2 flex-1"
                        />
                        <span className="text-xs text-muted-foreground">
                          {Math.round(course.progress_percentage)}%
                        </span>
                      </div>
                    </div>
                    <PlayCircle className="h-5 w-5 shrink-0 text-brand-600" />
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Webinars */}
      {myWebinars.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Video className="h-5 w-5" />
              My Webinars
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myWebinars.map((webinar) => {
                const wTitle =
                  locale === "ar" && webinar.title_ar
                    ? webinar.title_ar
                    : webinar.title;
                return (
                  <Link
                    key={webinar.id}
                    href={`/${locale}/webinars/${webinar.id}`}
                    className="flex items-center gap-4 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-info/10">
                      <Video className="h-5 w-5 text-info" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{wTitle}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {formatDate(webinar.scheduled_at, locale)}
                        <span>{formatDuration(webinar.duration_minutes)}</span>
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommended */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("recommended")}</CardTitle>
        </CardHeader>
        <CardContent>
          {recommendations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Complete your first course to get personalized recommendations.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {recommendations.map((rec) => (
                <RecommendationCard key={rec.courseId} {...rec} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
