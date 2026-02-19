"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Bell, BookOpen, Award, Video, CheckCircle } from "lucide-react";
import { formatRelativeDate } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/cn";
import type { Notification } from "@/types";

interface NotificationDropdownProps {
  notifications: Notification[];
  onMarkAllRead: () => void;
  onClose: () => void;
}

function getIcon(title: string) {
  if (title.toLowerCase().includes("enroll")) return BookOpen;
  if (title.toLowerCase().includes("certif")) return Award;
  if (title.toLowerCase().includes("webinar")) return Video;
  if (title.toLowerCase().includes("complet")) return CheckCircle;
  return Bell;
}

export function NotificationDropdown({
  notifications,
  onMarkAllRead,
  onClose,
}: NotificationDropdownProps) {
  const locale = useLocale();
  const t = useTranslations("notifications");

  return (
    <div className="absolute end-0 top-full z-50 mt-1 w-80 rounded-md border bg-background shadow-lg">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="font-semibold text-sm">{t("title")}</h3>
        {notifications.length > 0 && (
          <button
            onClick={onMarkAllRead}
            className="text-xs text-brand-600 hover:underline"
          >
            {t("markAllRead")}
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            {t("noNotifications")}
          </div>
        ) : (
          notifications.map((notification) => {
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
              <div
                key={notification.id}
                className={cn(
                  "flex gap-3 px-4 py-3 border-b last:border-0 hover:bg-muted/50 transition-colors",
                  !notification.read_at && "bg-brand-50/50"
                )}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {body}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatRelativeDate(notification.created_at, locale)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t px-4 py-2">
        <Link
          href={`/${locale}/notifications`}
          onClick={onClose}
          className="block text-center text-xs text-brand-600 hover:underline py-1"
        >
          View all notifications
        </Link>
      </div>
    </div>
  );
}
