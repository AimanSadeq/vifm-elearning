"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { useNotificationStore } from "@/stores/notification-store";
import { NotificationDropdown } from "./NotificationDropdown";
import type { Notification } from "@/types";

export function NotificationBell() {
  const { user } = useAuth();
  // Use individual selectors to prevent re-renders when unrelated store values change
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const fetchingRef = useRef(false);
  const mountedRef = useRef(true);

  // Stable userId primitive — avoids re-creating callbacks when user object reference changes
  const userId = user?.id;

  const fetchNotifications = useCallback(async () => {
    if (!userId || fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      const supabase = createClient();

      // Fetch unread count
      const { count, error: countError } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .is("read_at", null);

      if (!mountedRef.current) return;

      if (countError) {
        console.error("[Notifications] count query failed:", countError.message);
        return;
      }

      setUnreadCount(count ?? 0);

      // Fetch latest 5 unread
      const { data, error: listError } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .is("read_at", null)
        .order("created_at", { ascending: false })
        .limit(5);

      if (!mountedRef.current) return;

      if (listError) {
        console.error("[Notifications] list query failed:", listError.message);
        return;
      }

      setNotifications((data as Notification[]) ?? []);
    } catch (err) {
      console.error("[Notifications] fetch failed:", err);
    } finally {
      fetchingRef.current = false;
    }
  }, [userId, setUnreadCount]);

  // Fetch once on mount / when userId changes
  useEffect(() => {
    mountedRef.current = true;
    fetchNotifications();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchNotifications]);

  // Realtime subscription — separate from fetchNotifications to avoid dep cycle.
  // We read fetchNotifications via a ref so this effect only re-runs when userId changes.
  const fetchRef = useRef(fetchNotifications);
  fetchRef.current = fetchNotifications;

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchRef.current();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleMarkAllRead = async () => {
    if (!userId) return;

    try {
      const supabase = createClient();
      await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", userId)
        .is("read_at", null);

      setUnreadCount(0);
      setNotifications([]);
    } catch (err) {
      console.error("[Notifications] mark all read failed:", err);
    }
  };

  if (!userId) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -end-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <NotificationDropdown
            notifications={notifications}
            onMarkAllRead={handleMarkAllRead}
            onClose={() => setIsOpen(false)}
          />
        </>
      )}
    </div>
  );
}
