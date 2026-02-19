"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { WebinarCard } from "@/components/webinars/WebinarCard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import type { Webinar } from "@/types";

export default function WebinarsPage() {
  const t = useTranslations("webinars");

  const [upcoming, setUpcoming] = useState<Webinar[]>([]);
  const [past, setPast] = useState<Webinar[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchWebinars() {
      const supabase = createClient();
      const now = new Date().toISOString();

      const [upcomingRes, pastRes] = await Promise.all([
        supabase
          .from("webinars")
          .select(
            `*, instructor:profiles!webinars_instructor_id_fkey(full_name)`
          )
          .in("status", ["scheduled", "live"])
          .gte("scheduled_at", now)
          .order("scheduled_at", { ascending: true }),
        supabase
          .from("webinars")
          .select(
            `*, instructor:profiles!webinars_instructor_id_fkey(full_name)`
          )
          .eq("status", "completed")
          .order("scheduled_at", { ascending: false })
          .limit(12),
      ]);

      setUpcoming((upcomingRes.data as Webinar[]) ?? []);
      setPast((pastRes.data as Webinar[]) ?? []);
      setIsLoading(false);
    }

    fetchWebinars();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-10">
      {/* Upcoming Webinars */}
      <section>
        <h1 className="font-heading text-3xl font-bold mb-6">{t("upcoming")}</h1>
        {upcoming.length === 0 ? (
          <p className="text-muted-foreground">No upcoming webinars at the moment.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((webinar) => (
              <WebinarCard key={webinar.id} webinar={webinar} />
            ))}
          </div>
        )}
      </section>

      {/* Past Webinars */}
      {past.length > 0 && (
        <section>
          <h2 className="font-heading text-2xl font-bold mb-6">{t("past")}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((webinar) => (
              <WebinarCard key={webinar.id} webinar={webinar} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
