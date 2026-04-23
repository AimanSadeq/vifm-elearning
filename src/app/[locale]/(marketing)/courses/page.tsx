"use client";

import { useState, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Search, BookOpen, Users, Award, ChevronLeft, ChevronRight } from "lucide-react";
import {
  CourseFilters,
  type CourseFilterValues,
} from "@/components/courses/CourseFilters";
import { CourseGrid } from "@/components/courses/CourseGrid";
import { useCoursesCatalog } from "@/lib/hooks/useCourses";
import { useCourseFacets } from "@/lib/hooks/useCourseFacets";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { Button } from "@/components/ui/button";

const VALID_SORTS = new Set([
  "newest",
  "popular",
  "highest_rated",
  "price_asc",
  "price_desc",
]);
const VALID_DIFFICULTIES = new Set(["beginner", "intermediate", "advanced", "expert"]);

export default function CourseCatalogPage() {
  const t = useTranslations("courses");
  const tc = useTranslations("common");
  const locale = useLocale();
  const searchParams = useSearchParams();

  const initialFilters: CourseFilterValues = useMemo(() => {
    const price = searchParams.get("price");
    const sort = searchParams.get("sort");
    const category = searchParams.get("category");
    const difficulty = searchParams.get("difficulty");
    const search = searchParams.get("q") ?? searchParams.get("search") ?? "";
    return {
      search,
      category: category || "all",
      difficulty: difficulty && VALID_DIFFICULTIES.has(difficulty) ? difficulty : "all",
      priceRange:
        price === "free" || price === "paid" ? (price as "free" | "paid") : "all",
      sortBy: sort && VALID_SORTS.has(sort) ? sort : "newest",
    };
    // Only read query params once on first render; user interactions take over afterward.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [filters, setFilters] = useState<CourseFilterValues>(initialFilters);
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(filters.search, 300);
  const debouncedFilters = useMemo(
    () => ({ ...filters, search: debouncedSearch }),
    [filters, debouncedSearch]
  );

  const { courses, isLoading, totalCount, totalPages } = useCoursesCatalog({
    filters: debouncedFilters,
    page,
    pageSize: 12,
  });

  const facets = useCourseFacets();

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
    <div>
      {/* Hero */}
      <section
        className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 text-white"
      >
        <div
          aria-hidden
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, rgba(83,145,213,0.25), transparent 40%), radial-gradient(circle at 80% 70%, rgba(83,145,213,0.18), transparent 45%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(currentColor 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="container relative mx-auto px-4 py-14 md:py-20 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium tracking-wide backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
            {t("catalog")}
          </span>
          <h1 className="mt-5 font-heading text-3xl md:text-5xl font-bold leading-tight">
            {locale === "ar"
              ? "اكتشف دوراتنا المتخصصة"
              : "Level up your career"}
          </h1>
          <p className="mt-3 max-w-xl mx-auto text-white/75 text-base md:text-lg">
            {locale === "ar"
              ? "دورات عالمية في التمويل، المصرفية، البيانات، والقيادة"
              : "Professional courses in Finance, Banking, Data, and Leadership — taught by industry leaders."}
          </p>

          {/* Search */}
          <div className="mt-7 mx-auto max-w-xl">
            <div className="relative">
              <Search className="absolute start-4 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-900/70" />
              <input
                type="search"
                value={filters.search}
                onChange={(e) =>
                  handleFiltersChange({ ...filters, search: e.target.value })
                }
                placeholder={
                  locale === "ar"
                    ? "ابحث عن دورة، فئة، أو مدرب..."
                    : "Search courses, categories, or instructors..."
                }
                className="w-full rounded-full bg-white text-brand-900 ps-12 pe-5 py-4 text-base placeholder:text-brand-900/50 shadow-lg outline-none ring-0 focus:ring-4 focus:ring-brand-400/40 transition"
                aria-label={tc("search")}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-white/85">
            <Stat
              icon={<BookOpen className="h-4 w-4" />}
              value={totalCount > 0 ? totalCount : "—"}
              label={tc("courses")}
            />
            <span className="hidden sm:block h-4 w-px bg-white/20" />
            <Stat
              icon={<Users className="h-4 w-4" />}
              value={facets.isLoading ? "—" : facets.categoryCount}
              label={locale === "ar" ? "فئة" : "Categories"}
            />
            <span className="hidden sm:block h-4 w-px bg-white/20" />
            <Stat
              icon={<Award className="h-4 w-4" />}
              value={locale === "ar" ? "معتمدة" : "Certified"}
              label={locale === "ar" ? "دورات" : "Programs"}
            />
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="container mx-auto px-4 py-10">
        {/* Filters bar */}
        <div className="mb-6 rounded-2xl border bg-card p-4 shadow-card">
          <CourseFilters
            filters={filters}
            onChange={handleFiltersChange}
            availableDifficulties={facets.availableDifficulties}
            difficultyCounts={facets.difficultyCounts}
            freeCount={facets.freeCount}
          />
        </div>

        {/* Result summary */}
        {!isLoading && (
          <div className="mb-5 flex items-center justify-between text-sm">
            <p className="text-muted-foreground">
              {locale === "ar"
                ? `${totalCount} دورة ${hasActiveFilters ? "مطابقة للبحث" : ""}`
                : `${totalCount} ${totalCount === 1 ? "course" : "courses"}${
                    hasActiveFilters ? " found" : ""
                  }`}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                className="text-brand-600 hover:text-brand-700 font-medium"
                onClick={() =>
                  handleFiltersChange({
                    search: "",
                    category: "all",
                    difficulty: "all",
                    priceRange: "all",
                    sortBy: "newest",
                  })
                }
              >
                {locale === "ar" ? "إعادة تعيين" : "Reset filters"}
              </button>
            )}
          </div>
        )}

        {/* Grid */}
        <CourseGrid courses={courses} isLoading={isLoading} />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => {
                setPage((p) => p - 1);
                if (typeof window !== "undefined")
                  window.scrollTo({ top: 0, behavior: "smooth" });
              }}
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
                    onClick={() => {
                      setPage(pageNum);
                      if (typeof window !== "undefined")
                        window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
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
              onClick={() => {
                setPage((p) => p + 1);
                if (typeof window !== "undefined")
                  window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              {tc("next")}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-brand-400">{icon}</span>
      <span className="font-semibold">{value}</span>
      <span className="text-white/70">{label}</span>
    </div>
  );
}

