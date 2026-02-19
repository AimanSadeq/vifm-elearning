"use client";

import { useLocale, useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/shared/SearchBar";
import { CATEGORIES, DIFFICULTY_LEVELS } from "@/lib/utils/constants";
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
}

export function CourseFilters({ filters, onChange }: CourseFiltersProps) {
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

  return (
    <div className="space-y-4">
      {/* Search + Sort */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar
          value={filters.search}
          onChange={(value) => updateFilter("search", value)}
          placeholder={t("search")}
          className="w-full sm:max-w-sm"
        />

        <select
          value={filters.sortBy}
          onChange={(e) => updateFilter("sortBy", e.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="newest">{t("newest")}</option>
          <option value="popular">{t("popular")}</option>
          <option value="highest_rated">{t("highestRated")}</option>
          <option value="price_asc">{t("priceLowToHigh")}</option>
          <option value="price_desc">{t("priceHighToLow")}</option>
        </select>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          {t("filter")}:
        </span>

        {/* Categories */}
        <FilterChip
          active={filters.category === "all"}
          onClick={() => updateFilter("category", "all")}
        >
          {t("all")}
        </FilterChip>
        {CATEGORIES.map((cat) => (
          <FilterChip
            key={cat.slug}
            active={filters.category === cat.slug}
            onClick={() => updateFilter("category", cat.slug)}
          >
            {locale === "ar" ? cat.nameAr : cat.name}
          </FilterChip>
        ))}

        {/* Separator */}
        <div className="h-6 w-px bg-border" />

        {/* Difficulty */}
        {DIFFICULTY_LEVELS.map((level) => (
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
          </FilterChip>
        ))}

        {/* Separator */}
        <div className="h-6 w-px bg-border" />

        {/* Price */}
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
        </FilterChip>

        {/* Clear filters */}
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-7 gap-1 text-xs text-muted-foreground"
          >
            <X className="h-3 w-3" />
            Clear ({activeFilterCount})
          </Button>
        )}
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
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-brand-600 bg-brand-600 text-white"
          : "border-border bg-background text-muted-foreground hover:border-brand-300 hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
