"use client";

import { useEffect, useState, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Bell, BookOpen, Award, Video, CheckCircle, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { useNotificationStore } from "@/stores/notification-store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { formatRelativeDate } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/cn";
import type { Notification } from "@/types";

function getIcon(title: string) {
  if (title.toLowerCase().includes("enroll")) return BookOpen;
  if (title.toLowerCase().includes("certif")) return Award;
  if (title.toLowerCase().includes("webinar")) return Video;
  if (title.toLowerCase().includes("complet")) return CheckCircle;
  return Bell;
}

export default function NotificationsPage() {
  const locale = useLocale();
  const t = useTranslations("notifications");
  const { user, isLoading: authLoading } = useAuth();
  const { setUnreadCount } = useNotificationStore();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 20;

  const fetchNotifications = useCallback(async (pageNum: number = 0) => {
    if (!user) return;

    const supabase = createClient();
    const from = pageNum * pageSize;

    const { data, count } = await supabase
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);

    const newItems = (data as Notification[]) ?? [];
    if (pageNum === 0) {
      setNotifications(newItems);
    } else {
      setNotifications((prev) => [...prev, ...newItems]);
    }
    setHasMore((count ?? 0) > from + newItems.length);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) fetchNotifications(0);
  }, [user, authLoading, fetchNotifications]);

  const handleMarkAllRead = async () => {
    if (!user) return;

    const supabase = createClient();
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("read_at", null);

    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
    );
    setUnreadCount(0);
  };

  const handleMarkRead = async (notificationId: string) => {
    const supabase = createClient();
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId);

    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId
          ? { ...n, read_at: new Date().toISOString() }
          : n
      )
    );
    setUnreadCount(Math.max(0, useNotificationStore.getState().unreadCount - 1));
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">{t("title")}</h1>
        {notifications.some((n) => !n.read_at) && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <Check className="h-4 w-4 me-1" />
            {t("markAllRead")}
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <p className="mt-4 text-muted-foreground">{t("noNotifications")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const title =
              locale === "ar" && notification.title_ar
                ? notification.title_ar
                : notification.title;
            const body =
              locale === "ar" && notification.body_ar
                ? notification.body_ar
                : notification.body;
            const Icon = getIcon(notification.title);

            return (
              <Card
                key={notification.id}
                className={cn(
                  "transition-colors",
                  !notification.read_at && "bg-brand-50/50 border-brand-200"
                )}
              >
                <CardContent className="flex items-start gap-4 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{body}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatRelativeDate(notification.created_at, locale)}
                    </p>
                  </div>
                  {!notification.read_at && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0"
                      onClick={() => handleMarkRead(notification.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {hasMore && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  const nextPage = page + 1;
                  setPage(nextPage);
                  fetchNotifications(nextPage);
                }}
              >
                Load More
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
