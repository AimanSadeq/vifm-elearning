import { supabaseAdmin } from "@/lib/supabase/admin";

export interface NotificationPreferences {
  email_notifications: boolean;
  webinar_reminders: boolean;
  course_updates: boolean;
  marketing_emails: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  email_notifications: true,
  webinar_reminders: true,
  course_updates: true,
  marketing_emails: false,
};

export type NotificationChannel = keyof NotificationPreferences;

export function withDefaults(
  partial: Partial<NotificationPreferences> | null | undefined,
): NotificationPreferences {
  return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...(partial ?? {}) };
}

/**
 * Read a user's prefs. Returns defaults if the row or column is missing
 * (older accounts created before the migration). Safe for use in
 * dispatch paths — never throws.
 */
export async function getUserNotificationPreferences(
  userId: string,
): Promise<NotificationPreferences> {
  try {
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("notification_preferences")
      .eq("id", userId)
      .maybeSingle();
    return withDefaults(
      (data as { notification_preferences?: Partial<NotificationPreferences> } | null)
        ?.notification_preferences,
    );
  } catch {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }
}

/**
 * Helper for dispatch sites — "should I send this channel to this user?".
 * Returns true on errors so we err on the side of delivery for ops-critical
 * channels; marketing should not call this (call canSendMarketing instead).
 */
export async function canSendChannel(
  userId: string,
  channel: NotificationChannel,
): Promise<boolean> {
  const prefs = await getUserNotificationPreferences(userId);
  return prefs[channel] === true;
}
