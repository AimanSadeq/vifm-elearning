"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { BookOpen, Clock, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import type { DifficultyLevel } from "@/types";

interface PathCard {
  id: string;
  title: string;
  title_ar?: string | null;
  description?: string | null;
  description_ar?: string | null;
  slug: string;
  thumbnail_url?: string | null;
  difficulty_level?: DifficultyLevel | null;
  estimated_hours: number;
  enrollment_count: number;
  is_featured: boolean;
  course_count: number;
  category_name?: string;
  category_name_ar?: string;
}

export default function LearningPathsPage() {
  const t = useTranslations("learningPaths");
  const locale = useLocale();
  const [paths, setPaths] = useState<PathCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPaths() {
      const supabase = createClient();
      const { data } = await supabase
        .from("learning_paths")
        .select(
          `
          id, title, title_ar, description, description_ar,
          slug, thumbnail_url, difficulty_level,
          estimated_hours, enrollment_count, is_featured,
          categories:category_id (name, name_ar),
          learning_path_courses (id)
        `
        )
        .eq("is_published", true)
        .order("sort_order", { ascending: true });

      const mapped: PathCard[] = (data ?? []).map(
        (p: Record<string, unknown>) => {
          const cats = p.categories as Record<string, string> | null;
          return {
            id: p.id as string,
            title: p.title as string,
            title_ar: p.title_ar as string | null,
            description: p.description as string | null,
            description_ar: p.description_ar as string | null,
            slug: p.slug as string,
            thumbnail_url: p.thumbnail_url as string | null,
            difficulty_level: p.difficulty_level as DifficultyLevel | null,
            estimated_hours: p.estimated_hours as number,
            enrollment_count: p.enrollment_count as number,
            is_featured: p.is_featured as boolean,
            course_count: Array.isArray(p.learning_path_courses)
              ? p.learning_path_courses.length
              : 0,
            category_name: cats?.name,
            category_name_ar: cats?.name_ar,
          };
        }
      );

      setPaths(mapped);
      setIsLoading(false);
    }
    fetchPaths();
  }, []);

  function getDifficultyBadge(level?: DifficultyLevel | null) {
    switch (level) {
      case "gateway":
        return <Badge variant="success">{t("gateway")}</Badge>;
      case "professional":
        return <Badge variant="info">{t("professional")}</Badge>;
      case "executive":
        return <Badge variant="warning">{t("executive")}</Badge>;
      case "expert":
        return <Badge variant="destructive">{t("expert")}</Badge>;
      default:
        return null;
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      {paths.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={t("noPaths")}
          description={t("noPathsDescription")}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {paths.map((path) => {
            const title =
              locale === "ar" && path.title_ar ? path.title_ar : path.title;
            const desc =
              locale === "ar" && path.description_ar
                ? path.description_ar
                : path.description;
            const catName =
              locale === "ar"
                ? path.category_name_ar
                : path.category_name;

            return (
              <Link
                key={path.id}
                href={`/${locale}/learning-paths/${path.slug}`}
              >
                <Card className="group overflow-hidden transition-all hover:shadow-card-hover h-full">
                  {/* Thumbnail */}
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    {path.thumbnail_url ? (
                      <Image
                        src={path.thumbnail_url}
                        alt={title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-brand-50">
                        <BookOpen className="h-10 w-10 text-brand-300" />
                      </div>
                    )}
                    {path.is_featured && (
                      <Badge
                        variant="warning"
                        className="absolute start-2 top-2"
                      >
                        {t("featured")}
                      </Badge>
                    )}
                  </div>

                  <CardContent className="p-4 flex flex-col gap-2">
                    {catName && (
                      <p className="text-xs text-muted-foreground">
                        {catName}
                      </p>
                    )}
                    <h3 className="font-semibold line-clamp-2 group-hover:text-brand-600 transition-colors">
                      {title}
                    </h3>
                    {desc && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {desc}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-auto pt-2 text-xs text-muted-foreground">
                      {getDifficultyBadge(path.difficulty_level)}
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5" />
                        {path.course_count} {t("courses")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {path.estimated_hours}h
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {path.enrollment_count}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
