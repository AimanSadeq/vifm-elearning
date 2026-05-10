"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Search,
  Tag,
  Users,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CourseGrid } from "@/components/courses/CourseGrid";
import {
  CourseFilters,
  type CourseFilterValues,
} from "@/components/courses/CourseFilters";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/lib/hooks/useDebounce";
import type { Course } from "@/types";
import { escapeIlike } from "@/lib/utils/escape-search";
import type {
  CategoryRow,
  CategorySibling,
  CategoryFacets,
} from "@/lib/server/catalog-data";

const PAGE_SIZE = 12;

interface Props {
  slug: string;
  category: CategoryRow | null;
  siblings: CategorySibling[];
  facets: CategoryFacets;
  initialCourses: Course[];
  initialTotalCount: number;
}

export default function CategoryClient({
  slug,
  category,
  siblings,
  facets,
  initialCourses,
  initialTotalCount,
}: Props) {
  const locale = useLocale();
  const t = useTranslations("common");

  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [isLoading, setIsLoading] = useState(false);

  const [filters, setFilters] = useState<CourseFilterValues>({
    search: "",
    category: "all",
    difficulty: "all",
    priceRange: "all",
    sortBy: "newest",
  });
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(filters.search, 300);
  const effectiveSearch = useMemo(() => debouncedSearch, [debouncedSearch]);

  const isFirstRun = useRef(true);

  useEffect(() => {
    if (!category) return;

    // First render uses SSR-baked initialCourses; skip the immediate refetch.
    // Subsequent filter / page / locale changes hit the network normally.
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    async function run() {
      if (!category) return;
      const supabase = createClient();

      let query = supabase
        .from("courses")
        .select(
          `
          *,
          category:categories(id, name, name_ar, slug, color),
          instructor:profiles!courses_instructor_id_fkey(full_name, full_name_ar, avatar_url)
        `,
          { count: "exact" }
        )
        .eq("status", "published")
        .eq("category_id", category.id);

      if (locale === "ar") {
        query = query
          .not("title_ar", "is", null)
          .neq("title_ar", "")
          .filter("title_ar", "match", "[؀-ۿ]");
      } else {
        query = query
          .not("title", "is", null)
          .neq("title", "")
          .filter("title", "match", "[A-Za-z]");
      }

      if (effectiveSearch) {
        const s = escapeIlike(effectiveSearch);
        query = query.or(
          `title.ilike.%${s}%,title_ar.ilike.%${s}%,description.ilike.%${s}%`
        );
      }

      if (filters.difficulty !== "all") {
        query = query.eq("difficulty_level", filters.difficulty);
      }

      if (filters.priceRange === "free") query = query.eq("is_free", true);
      else if (filters.priceRange === "paid") query = query.eq("is_free", false);

      switch (filters.sortBy) {
        case "popular":
          query = query.order("enrollment_count", { ascending: false });
          break;
        case "highest_rated":
          query = query.order("average_rating", { ascending: false });
          break;
        case "price_asc":
          query = query.order("price", { ascending: true });
          break;
        case "price_desc":
          query = query.order("price", { ascending: false });
          break;
        case "newest":
        default:
          query = query.order("published_at", {
            ascending: false,
            nullsFirst: false,
          });
          break;
      }

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      query = query.range(from, to);

      const { data, count } = await query;
      if (cancelled) return;

      setCourses((data as Course[]) ?? []);
      setTotalCount(count ?? 0);
      setIsLoading(false);
    }

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    category,
    effectiveSearch,
    filters.difficulty,
    filters.priceRange,
    filters.sortBy,
    page,
    locale,
  ]);

  // Not found
  if (!category) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-5">
          <Tag className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold">
          {locale === "ar" ? "الفئة غير موجودة" : "Category not found"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {locale === "ar"
            ? `لا توجد فئة بهذا الاسم: “${slug}”`
            : `We couldn't find a category with the slug “${slug}”.`}
        </p>
        <Link
          href={`/${locale}/courses`}
          className="mt-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium hover:bg-muted transition"
        >
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
          {locale === "ar" ? "عرض كل الدورات" : "Browse all courses"}
        </Link>
      </div>
    );
  }

  const categoryName =
    locale === "ar" && category.name_ar ? category.name_ar : category.name ?? slug;
  const description =
    locale === "ar" && category.description_ar
      ? category.description_ar
      : category.description;

  const accentColor = category.color || "#1e3d6e";
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const hasActiveFilters =
    filters.search ||
    filters.difficulty !== "all" ||
    filters.priceRange !== "all";

  const availableDifficulties = ["beginner", "intermediate", "advanced", "expert"].filter(
    (d) => (facets.difficulties[d] ?? 0) > 0
  );

  const handleFiltersChange = (nf: CourseFilterValues) => {
    setFilters(nf);
    setPage(1);
  };

  return (
    <div>
      {/* Hero */}
      <section
        className="relative overflow-hidden text-white"
        style={{
          background: `linear-gradient(135deg, ${accentColor} 0%, #111232 70%, #010131 100%)`,
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div
          aria-hidden
          className="absolute -top-24 end-0 w-[500px] h-[500px] rounded-full opacity-30 blur-3xl"
          style={{ background: accentColor }}
        />

        <div className="container relative mx-auto px-4 py-10 md:py-14">
          <Link
            href={`/${locale}/courses`}
            className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
            {locale === "ar" ? "كل الدورات" : "All courses"}
          </Link>

          <div className="mt-6 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium tracking-wide backdrop-blur">
                <Tag className="h-3 w-3" />
                {locale === "ar" ? "فئة" : "Category"}
              </div>
              <h1 className="mt-3 font-heading text-3xl md:text-5xl font-bold leading-tight">
                {categoryName}
              </h1>
              {description && (
                <p className="mt-3 text-white/80 text-base md:text-lg max-w-xl">
                  {description}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-white/85">
              <Stat
                icon={<BookOpen className="h-4 w-4" />}
                value={
                  totalCount > 0
                    ? totalCount
                    : facets.freeCount +
                      Object.values(facets.difficulties).reduce(
                        (a, b) => a + b,
                        0
                      )
                }
                label={locale === "ar" ? "دورة" : "Courses"}
              />
              {facets.freeCount > 0 && (
                <>
                  <span className="hidden sm:block h-4 w-px bg-white/20" />
                  <Stat
                    icon={<Sparkles className="h-4 w-4" />}
                    value={facets.freeCount}
                    label={locale === "ar" ? "مجاني" : "Free"}
                  />
                </>
              )}
              {siblings.length > 0 && (
                <>
                  <span className="hidden sm:block h-4 w-px bg-white/20" />
                  <Stat
                    icon={<Users className="h-4 w-4" />}
                    value={siblings.length + 1}
                    label={locale === "ar" ? "فئات" : "Categories"}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="container mx-auto px-4 py-10">
        {/* Search + Filters */}
        <div className="mb-6 rounded-2xl border bg-card p-4 shadow-card space-y-4">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              value={filters.search}
              onChange={(e) =>
                handleFiltersChange({ ...filters, search: e.target.value })
              }
              placeholder={
                locale === "ar"
                  ? `ابحث داخل ${categoryName}...`
                  : `Search within ${categoryName}...`
              }
              className="w-full rounded-lg border bg-background ps-10 pe-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-400/20 outline-none transition"
            />
          </div>

          {(availableDifficulties.length > 0 || facets.freeCount > 0) && (
            <div className="pt-1 border-t">
              <div className="pt-3">
                <CourseFilters
                  filters={filters}
                  onChange={handleFiltersChange}
                  availableDifficulties={availableDifficulties}
                  difficultyCounts={facets.difficulties}
                  freeCount={facets.freeCount}
                />
              </div>
            </div>
          )}
        </div>

        {/* Result summary */}
        {!isLoading && (
          <div className="mb-5 flex items-center justify-between text-sm">
            <p className="text-muted-foreground">
              {locale === "ar"
                ? `${totalCount} دورة ${hasActiveFilters ? "مطابقة" : ""}`
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
              {t("previous")}
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) pageNum = i + 1;
                else if (page <= 3) pageNum = i + 1;
                else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = page - 2 + i;
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
              {t("next")}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Other categories */}
        {siblings.length > 0 && (
          <section className="mt-16 pt-10 border-t">
            <h2 className="font-heading text-xl md:text-2xl font-bold mb-4">
              {locale === "ar" ? "تصفح فئات أخرى" : "Explore other categories"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {siblings.map((c) => {
                const name = locale === "ar" && c.name_ar ? c.name_ar : c.name;
                return (
                  <Link
                    key={c.id}
                    href={`/${locale}/categories/${c.slug}`}
                    className="group flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 transition hover:border-brand-300 hover:shadow-card"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center"
                        style={{
                          background: (c.color ?? "#1e3d6e") + "20",
                          color: c.color ?? "#1e3d6e",
                        }}
                      >
                        <Tag className="h-4 w-4" />
                      </span>
                      <span className="text-sm font-medium truncate group-hover:text-brand-600 transition-colors">
                        {name}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {c.count} {locale === "ar" ? "دورة" : "courses"}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
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
      <span className="text-white/70">{icon}</span>
      <span className="font-semibold">{value}</span>
      <span className="text-white/70">{label}</span>
    </div>
  );
}
