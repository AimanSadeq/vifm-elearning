import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  withDefaults,
  type NotificationPreferences,
} from "@/lib/services/notification-preferences";

const updateSchema = z
  .object({
    email_notifications: z.boolean().optional(),
    webinar_reminders: z.boolean().optional(),
    course_updates: z.boolean().optional(),
    marketing_emails: z.boolean().optional(),
  })
  .strict();

export async function GET() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabaseAdmin
    .from("profiles")
    .select("notification_preferences")
    .eq("id", user.id)
    .maybeSingle();

  return NextResponse.json({
    data: withDefaults(
      (data as { notification_preferences?: Partial<NotificationPreferences> } | null)
        ?.notification_preferences,
    ),
    defaults: DEFAULT_NOTIFICATION_PREFERENCES,
  });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid fields", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Merge with existing so partial PATCH bodies don't wipe other keys.
  const { data: existingRow } = await supabaseAdmin
    .from("profiles")
    .select("notification_preferences")
    .eq("id", user.id)
    .maybeSingle();

  const existing = withDefaults(
    (existingRow as {
      notification_preferences?: Partial<NotificationPreferences>;
    } | null)?.notification_preferences,
  );
  const next: NotificationPreferences = { ...existing, ...parsed.data };

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ notification_preferences: next })
    .eq("id", user.id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: next });
}
