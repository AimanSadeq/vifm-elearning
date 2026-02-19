// Notification service for creating and managing in-app notifications

import { createClient } from "@/lib/supabase/client";

export async function createNotification(params: {
  userId: string;
  title: string;
  titleAr?: string;
  body: string;
  bodyAr?: string;
  channel?: "email" | "whatsapp" | "in_app";
  actionUrl?: string;
}) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: params.userId,
      title: params.title,
      title_ar: params.titleAr || null,
      body: params.body,
      body_ar: params.bodyAr || null,
      channel: params.channel || "in_app",
      action_url: params.actionUrl || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create notification:", error);
    return null;
  }

  return data;
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
