"use client";

import { useLocale, useTranslations } from "next-intl";
import { X, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export interface CourseFilterValues {
  search: string;
  category: string;
  difficulty: string;
  priceRange: "all" | "free" | "paid";
  sortBy: string;
}

interface CourseFiltersProps {
  filters: CourseFilterValues;
  onChange: (filters: CourseFilterValues) => void;
  availableDifficulties?: string[];
  difficultyCounts?: Record<string, number>;
  freeCount?: number;
}

export function CourseFilters({
  filters,
  onChange,
  availableDifficulties,
  difficultyCounts,
  freeCount,
}: CourseFiltersProps) {
  const t = useTranslations("common");
  const tc = useTranslations("courses");
  const locale = useLocale();

  const updateFilter = (key: keyof CourseFilterValues, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const activeFilterCount = [
    filters.category !== "all",
    filters.difficulty !== "all",
    filters.priceRange !== "all",
  ].filter(Boolean).length;

  const clearFilters = () => {
    onChange({
      search: filters.search,
      category: "all",
      difficulty: "all",
      priceRange: "all",
      sortBy: filters.sortBy,
    });
  };

  const difficulties = availableDifficulties ?? [];
  const showFree = freeCount === undefined || freeCount > 0;

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
      {/* Difficulty chips */}
      <div className="flex flex-wrap items-center gap-2 flex-1">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {t("filter")}
        </span>

        {difficulties.map((level) => {
          const count = difficultyCounts?.[level];
          return (
            <FilterChip
              key={level}
              active={filters.difficulty === level}
              onClick={() =>
                updateFilter(
                  "difficulty",
                  filters.difficulty === level ? "all" : level
                )
              }
            >
              {tc(level)}
              {count !== undefined && (
                <span className="ms-1 opacity-70">{count}</span>
              )}
            </FilterChip>
          );
        })}

        {difficulties.length > 0 && showFree && (
          <span className="h-6 w-px bg-border mx-1 hidden sm:block" />
        )}

        {showFree && (
          <FilterChip
            active={filters.priceRange === "free"}
            onClick={() =>
              updateFilter(
                "priceRange",
                filters.priceRange === "free" ? "all" : "free"
              )
            }
          >
            {tc("free")}
            {freeCount !== undefined && (
              <span className="ms-1 opacity-70">{freeCount}</span>
            )}
          </FilterChip>
        )}

        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
            {locale === "ar"
              ? `مسح (${activeFilterCount})`
              : `Clear (${activeFilterCount})`}
          </Button>
        )}
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2 shrink-0">
        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
        <label className="sr-only" htmlFor="sort-select">
          {locale === "ar" ? "ترتيب" : "Sort by"}
        </label>
        <select
          id="sort-select"
          value={filters.sortBy}
          onChange={(e) => updateFilter("sortBy", e.target.value)}
          className="rounded-lg border bg-background px-3 py-2 text-sm font-medium cursor-pointer hover:border-brand-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-400/20 outline-none transition"
        >
          <option value="newest">{t("newest")}</option>
          <option value="popular">{t("popular")}</option>
          <option value="highest_rated">{t("highestRated")}</option>
          <option value="price_asc">{t("priceLowToHigh")}</option>
          <option value="price_desc">{t("priceHighToLow")}</option>
        </select>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
        active
          ? "border-brand-600 bg-brand-600 text-white shadow-sm"
          : "border-border bg-background text-muted-foreground hover:border-brand-300 hover:text-foreground hover:bg-brand-50/60"
      )}
    >
      {children}
    </button>
  );
}
