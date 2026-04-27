"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { WebinarDetail } from "@/components/webinars/WebinarDetail";
import type { Webinar } from "@/types";

export default function WebinarDetailPage() {
  const params = useParams();
  const webinarId = params.id as string;
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("webinars");
  const tc = useTranslations("common");
  const { user } = useAuth();

  const [webinar, setWebinar] = useState<Webinar | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);

  // Fetch the webinar row once per webinarId — auth state changes shouldn't
  // re-pull this public row. The registration check has its own effect below.
  useEffect(() => {
    let cancelled = false;
    async function fetchWebinar() {
      const supabase = createClient();
      // recording_url has been moved to a separately-RLS'd table; fetched
      // on-demand via /api/webinars/[id]/recording after a plan check.
      const { data } = await supabase
        .from("webinars")
        .select(
          `*, instructor:profiles!webinars_instructor_id_fkey(full_name, full_name_ar, avatar_url)`
        )
        .eq("id", webinarId)
        .single();
      if (!cancelled) {
        setWebinar(data as Webinar | null);
        setIsLoading(false);
      }
    }
    fetchWebinar();
    return () => {
      cancelled = true;
    };
  }, [webinarId]);

  // Separate effect: only the registration lookup depends on the user.
  useEffect(() => {
    if (!user) {
      setIsRegistered(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data: reg } = await supabase
        .from("webinar_registrations")
        .select("id")
        .eq("webinar_id", webinarId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelled) setIsRegistered(!!reg);
    })();
    return () => {
      cancelled = true;
    };
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
      if (response.ok) setIsRegistered(true);
    } catch {
      /* swallow — UI just stays on the register button */
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
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <h1 className="font-heading text-2xl font-bold">{tc("error")}</h1>
        <p className="mt-2 text-muted-foreground">{t("notFound")}</p>
        <Link
          href={`/${locale}/webinars`}
          className="mt-4 inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"
        >
          {t("backToWebinars")}
        </Link>
      </div>
    );
  }

  return (
    <WebinarDetail
      webinar={webinar}
      isRegistered={isRegistered}
      isRegistering={isRegistering}
      onRegister={handleRegister}
    />
  );
}
