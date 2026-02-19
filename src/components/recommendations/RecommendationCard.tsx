"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale } from "next-intl";
import { BookOpen, Star, Users, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/formatters";

interface RecommendationCardProps {
  courseId: string;
  title: string;
  titleAr?: string | null;
  slug: string;
  thumbnailUrl?: string | null;
  price: number;
  currency: string;
  isFree: boolean;
  averageRating: number;
  enrollmentCount: number;
  reason: string;
}

export function RecommendationCard({
  title,
  titleAr,
  slug,
  thumbnailUrl,
  price,
  currency,
  isFree,
  averageRating,
  enrollmentCount,
  reason,
}: RecommendationCardProps) {
  const locale = useLocale();
  const displayTitle = locale === "ar" && titleAr ? titleAr : title;

  return (
    <Link href={`/${locale}/courses/${slug}`}>
      <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
        <div className="aspect-video relative overflow-hidden bg-muted">
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={displayTitle}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <BookOpen className="h-10 w-10 text-muted-foreground/30" />
            </div>
          )}
        </div>
        <CardContent className="p-4 space-y-2">
          <h3 className="font-medium line-clamp-2 text-sm">{displayTitle}</h3>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {averageRating > 0 && (
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-warning text-warning" />
                {averageRating.toFixed(1)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {enrollmentCount}
            </span>
          </div>

          <div className="flex items-center justify-between">
            {isFree ? (
              <Badge variant="success">Free</Badge>
            ) : (
              <span className="text-sm font-semibold">
                {formatCurrency(price, currency)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-xs text-brand-600">
            <Sparkles className="h-3 w-3" />
            <span>{reason}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
