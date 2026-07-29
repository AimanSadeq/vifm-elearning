"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { reportSupabaseError } from "@/lib/utils/supabase-error";
import { WebinarForm } from "@/components/admin/WebinarForm";
import { WebinarRecordingPanel } from "@/components/admin/WebinarRecordingPanel";
import type { WebinarInput } from "@/lib/utils/validators";

import { WEBINAR_PUBLIC_COLUMNS } from "@/lib/supabase/columns";
export default function EditWebinarPage() {
  const params = useParams();
  const webinarId = params.id as string;

  const [initialData, setInitialData] = useState<
    (Partial<WebinarInput> & { id: string }) | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchWebinar() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("webinars")
        // meeting_url / meeting_id are not granted to `authenticated`; this
        // form does not edit them.
        .select(WEBINAR_PUBLIC_COLUMNS)
        .eq("id", webinarId)
        .single();

      if (error) {
        reportSupabaseError(error, "Could not load webinar");
        setIsLoading(false);
        return;
      }
      if (data) {
        setInitialData({
          id: data.id,
          title: data.title,
          titleAr: data.title_ar || "",
          description: data.description || "",
          descriptionAr: data.description_ar || "",
          instructorId: data.instructor_id || "",
          categoryId: data.category_id || "",
          scheduledAt: data.scheduled_at
            ? new Date(data.scheduled_at).toISOString().slice(0, 16)
            : "",
          durationMinutes: data.duration_minutes,
          maxAttendees: data.max_attendees || undefined,
          isFree: data.is_free,
          price: data.price,
          currency: data.currency || "USD",
          tags: data.tags || [],
        });
      }
      setIsLoading(false);
    }

    fetchWebinar();
  }, [webinarId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!initialData) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Webinar not found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Edit Webinar</h1>
      <WebinarForm initialData={initialData} mode="edit" />
      <WebinarRecordingPanel webinarId={webinarId} />
    </div>
  );
}
