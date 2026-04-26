"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Calendar, Clock, Users, Video, CheckCircle, Loader2, Lock, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { formatCurrency, formatDate, formatDuration } from "@/lib/utils/formatters";
import type { Webinar } from "@/types";

export default function WebinarDetailPage() {
  const params = useParams();
  const webinarId = params.id as string;
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("webinars");
  const { user } = useAuth();

  const [webinar, setWebinar] = useState<Webinar | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [hasWebinarFeature, setHasWebinarFeature] = useState<boolean | null>(
    null
  );

  useEffect(() => {
    fetch("/api/account/features")
      .then((r) => r.json())
      .then((j) =>
        setHasWebinarFeature(Boolean(j.data?.features?.webinars))
      )
      .catch(() => setHasWebinarFeature(false));
  }, [user]);

  useEffect(() => {
    async function fetchWebinar() {
      const supabase = createClient();

      // Explicit column list — DO NOT include recording_url here. The
      // recording is fetched on-demand through /api/webinars/[id]/recording
      // which checks the user's plan-level `webinars` feature.
      const { data } = await supabase
        .from("webinars")
        .select(
          `id, title, title_ar, description, description_ar, thumbnail_url,
           instructor_id, category_id, status, scheduled_at, duration_minutes,
           is_recording_public, max_attendees, is_free, price, currency, tags,
           metadata, created_at, updated_at, cpe_hours,
           instructor:profiles!webinars_instructor_id_fkey(full_name, avatar_url)`
        )
        .eq("id", webinarId)
        .single();

      // The Webinar type still has recording_url; we explicitly leave it
      // unset on the client.
      setWebinar(data as Webinar | null);

      // Check registration status
      if (user && data) {
        const { data: reg } = await supabase
          .from("webinar_registrations")
          .select("id")
          .eq("webinar_id", webinarId)
          .eq("user_id", user.id)
          .single();

        setIsRegistered(!!reg);
      }

      setIsLoading(false);
    }

    fetchWebinar();
  }, [webinarId, user]);

  const handleRegister = async () => {
    if (!user) {
      router.push(`/${locale}/login?redirect=/${locale}/webinars/${webinarId}`);
      return;
    }

    setIsRegistering(true);

    try {
      const response = await fetch(`/api/webinars/${webinarId}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        setIsRegistered(true);
      }
    } catch {
      // Error handling
    } finally {
      setIsRegistering(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!webinar) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Webinar not found</p>
      </div>
    );
  }

  const title = locale === "ar" && webinar.title_ar ? webinar.title_ar : webinar.title;
  const description =
    locale === "ar" && webinar.description_ar
      ? webinar.description_ar
      : webinar.description;
  const instructorName =
    (webinar.instructor as unknown as { full_name: string })?.full_name ?? "";

  const statusBadge = () => {
    switch (webinar.status) {
      case "scheduled":
        return <Badge variant="info">Upcoming</Badge>;
      case "live":
        return <Badge variant="success">{t("live")}</Badge>;
      case "completed":
        return <Badge variant="secondary">Completed</Badge>;
      case "cancelled":
        return <Badge variant="warning">Cancelled</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="mb-2">{statusBadge()}</div>
            <h1 className="font-heading text-3xl font-bold">{title}</h1>
            {instructorName && (
              <p className="mt-2 text-lg text-muted-foreground">
                by {instructorName}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(webinar.scheduled_at, locale)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatDuration(webinar.duration_minutes)}
            </span>
            {webinar.max_attendees && (
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {webinar.max_attendees} {t("attendees")}
              </span>
            )}
          </div>

          {description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">About this Webinar</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {description}
                </p>
              </CardContent>
            </Card>
          )}

          {webinar.status === "completed" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Recording
                </CardTitle>
              </CardHeader>
              <CardContent>
                {hasWebinarFeature === null ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {locale === "ar"
                      ? "جارٍ التحقق من الوصول…"
                      : "Checking access…"}
                  </div>
                ) : hasWebinarFeature ? (
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await fetch(
                        `/api/webinars/${webinar.id}/recording`
                      );
                      const json = await res.json();
                      if (res.ok && json.data?.url) {
                        window.open(json.data.url, "_blank", "noopener");
                      } else {
                        alert(json.error ?? "Recording not available");
                      }
                    }}
                    className="text-brand-600 hover:underline"
                  >
                    {t("watchReplay")}
                  </button>
                ) : (
                  <div className="rounded-lg border bg-muted/30 p-4 flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-700">
                      <Lock className="h-4 w-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {!user
                          ? locale === "ar"
                            ? "سجّل الدخول للوصول إلى التسجيلات"
                            : "Sign in to access recordings"
                          : locale === "ar"
                            ? "ميزة التسجيلات متاحة في الباقة الفصلية وما فوق"
                            : "Recording access is included with Quarterly, Annual, and Lifetime plans"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {!user
                          ? locale === "ar"
                            ? "سجّل الدخول أو اشترك للمشاهدة."
                            : "Log in or subscribe to watch."
                          : locale === "ar"
                            ? "ترقية باقتك لتشاهد كل تسجيلات الندوات."
                            : "Upgrade your plan to watch this and every other past webinar."}
                      </p>
                      <Link
                        href={
                          !user
                            ? `/${locale}/login?redirect=/${locale}/webinars/${webinar.id}`
                            : `/${locale}/pricing`
                        }
                        className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        {!user
                          ? locale === "ar"
                            ? "تسجيل الدخول"
                            : "Sign in"
                          : locale === "ar"
                            ? "ترقية الباقة"
                            : "Upgrade plan"}
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <Card className="sticky top-24">
            <CardContent className="p-6 space-y-4">
              <p className="text-3xl font-bold">
                {webinar.is_free
                  ? "Free"
                  : formatCurrency(webinar.price, webinar.currency)}
              </p>

              {isRegistered ? (
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">{t("registered")}</span>
                </div>
              ) : webinar.status === "scheduled" || webinar.status === "live" ? (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleRegister}
                  disabled={isRegistering}
                >
                  {isRegistering && (
                    <Loader2 className="h-4 w-4 animate-spin me-2" />
                  )}
                  {t("registerNow")}
                </Button>
              ) : null}

              <div className="space-y-3 pt-4 border-t text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span>{formatDate(webinar.scheduled_at, locale)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span>{formatDuration(webinar.duration_minutes)}</span>
                </div>
                {instructorName && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Instructor</span>
                    <span>{instructorName}</span>
                  </div>
                )}
              </div>

              {webinar.tags && webinar.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2">
                  {webinar.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
