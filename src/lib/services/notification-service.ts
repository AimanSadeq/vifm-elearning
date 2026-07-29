// Notification service for creating and managing in-app notifications

import { createClient } from "@/lib/supabase/client";

/**
 * Create an in-app notification for a user.
 *
 * This used to INSERT straight into `notifications` with the *browser* client,
 * which meant any signed-in user could write a notification addressed to
 * anyone. `authenticated` no longer holds INSERT on that table; the write goes
 * through /api/notifications, which requires super_admin.
 */
export async function createNotification(params: {
  userId: string;
  title: string;
  titleAr?: string;
  body: string;
  bodyAr?: string;
  channel?: "email" | "whatsapp" | "in_app";
  actionUrl?: string;
}) {
  const res = await fetch("/api/notifications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { data: null, error: body.error ?? `Request failed (${res.status})` };
  }
  return { data: await res.json(), error: null };
}


export async function markAsRead(notificationId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId);

  return !error;
}

export async function markAllAsRead(userId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);

  return !error;
}
