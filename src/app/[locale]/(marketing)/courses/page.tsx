"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  CourseFilters,
  type CourseFilterValues,
} from "@/components/courses/CourseFilters";
import { CourseGrid } from "@/components/courses/CourseGrid";
import { FeaturedCourses } from "@/components/courses/FeaturedCourses";
import { useCoursesCatalog, useFeaturedCourses } from "@/lib/hooks/useCourses";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function CourseCatalogPage() {
  const t = useTranslations("courses");
  const tc = useTranslations("common");

  const [filters, setFilters] = useState<CourseFilterValues>({
    search: "",
    category: "all",
    difficulty: "all",
    priceRange: "all",
    sortBy: "newest",
  });
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(filters.search, 300);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFilters = useMemo(
    () => ({ ...filters, search: debouncedSearch }),
    [filters.category, filters.difficulty, filters.priceRange, filters.sortBy, debouncedSearch]
  );

  const { courses, isLoading, totalCount, totalPages } = useCoursesCatalog({
    filters: debouncedFilters,
    page,
    pageSize: 12,
  });

  const { courses: featuredCourses, isLoading: featuredLoading } =
    useFeaturedCourses();

  // Show featured section only when no filters active
  const hasActiveFilters =
    filters.search ||
    filters.category !== "all" ||
    filters.difficulty !== "all" ||
    filters.priceRange !== "all";

  const handleFiltersChange = (newFilters: CourseFilterValues) => {
    setFilters(newFilters);
    setPage(1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold">{t("catalog")}</h1>
        {totalCount > 0 && !isLoading && (
          <p className="mt-2 text-sm text-muted-foreground">
            {totalCount} {tc("courses").toLowerCase()}
          </p>
        )}
      </div>

      {/* Featured Section */}
      {!hasActiveFilters && (
        <div className="mb-10">
          <FeaturedCourses
            courses={featuredCourses}
            isLoading={featuredLoading}
          />
        </div>
      )}

      {/* Filters */}
      <div className="mb-6">
        <CourseFilters filters={filters} onChange={handleFiltersChange} />
      </div>

      {/* Course Grid */}
      <CourseGrid courses={courses} isLoading={isLoading} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            {tc("previous")}
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? "default" : "outline"}
                  size="sm"
                  className="h-9 w-9 p-0"
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            {tc("next")}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
