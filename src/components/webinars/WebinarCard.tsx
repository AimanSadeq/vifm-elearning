"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Calendar, Clock, Users, Video } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, formatDuration } from "@/lib/utils/formatters";
import type { Webinar } from "@/types";

interface WebinarCardProps {
  webinar: Webinar;
}

export function WebinarCard({ webinar }: WebinarCardProps) {
  const locale = useLocale();
  const t = useTranslations("webinars");

  const title = locale === "ar" && webinar.title_ar ? webinar.title_ar : webinar.title;
  const description =
    locale === "ar" && webinar.description_ar
      ? webinar.description_ar
      : webinar.description;
  const instructorName =
    (webinar.instructor as unknown as { full_name: string })?.full_name ?? "";

  const statusBadge = () => {
    switch (webinar.status) {
      case "scheduled":
        return <Badge variant="info">Upcoming</Badge>;
      case "live":
        return <Badge variant="success">{t("live")}</Badge>;
      case "completed":
        return <Badge variant="secondary">Completed</Badge>;
      case "cancelled":
        return <Badge variant="warning">Cancelled</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative h-40 bg-muted">
        {webinar.thumbnail_url ? (
          <Image
            src={webinar.thumbnail_url}
            alt={title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Video className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute top-2 end-2">{statusBadge()}</div>
      </div>
      <CardContent className="p-4 space-y-3">
        <h3 className="font-semibold line-clamp-2">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        )}

        {instructorName && (
          <p className="text-sm text-muted-foreground">{instructorName}</p>
        )}

        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(webinar.scheduled_at, locale)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDuration(webinar.duration_minutes)}
          </span>
          {webinar.max_attendees && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {webinar.max_attendees} {t("attendees")}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="font-semibold">
            {webinar.is_free
              ? "Free"
              : formatCurrency(webinar.price, webinar.currency)}
          </span>
          <Link href={`/${locale}/webinars/${webinar.id}`}>
            <Button size="sm">
              {webinar.status === "completed" ? t("watchReplay") : t("registerNow")}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
