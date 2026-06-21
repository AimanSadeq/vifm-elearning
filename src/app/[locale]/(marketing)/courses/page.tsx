import {
  getCachedCatalog,
  getCachedFacets,
  PAGE_SIZE_DEFAULT,
  type CatalogFilters,
} from "@/lib/server/catalog-data";
import type { CourseFilterValues } from "@/components/courses/CourseFilters";
import CourseCatalogClient from "./CourseCatalogClient";

const VALID_SORTS = new Set([
  "newest",
  "popular",
  "highest_rated",
  "price_asc",
  "price_desc",
]);
const VALID_DIFFICULTIES = new Set([
  "gateway",
  "professional",
  "executive",
  "expert",
]);

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Server-side course catalog. Pre-fetches the first paint via
 * `unstable_cache` (60s revalidate), then hands off to a client component
 * that owns filter state, debounced search, pagination, and subsequent
 * fetches. For a first-time visitor the courses are present in the HTML
 * payload — no waterfall, no skeleton flash, and Google sees the content.
 */
export default async function CoursesPage({
  params,
  searchParams,
}: PageProps) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);

  const search =
    typeof sp.q === "string"
      ? sp.q
      : typeof sp.search === "string"
        ? sp.search
        : "";
  const category = typeof sp.category === "string" ? sp.category : "all";
  const difficultyParam = typeof sp.difficulty === "string" ? sp.difficulty : "";
  const priceParam = typeof sp.price === "string" ? sp.price : "";
  const sortParam = typeof sp.sort === "string" ? sp.sort : "";

  const initialFilters: CourseFilterValues = {
    search,
    category: category || "all",
    difficulty: VALID_DIFFICULTIES.has(difficultyParam) ? difficultyParam : "all",
    priceRange:
      priceParam === "free" || priceParam === "paid"
        ? (priceParam as "free" | "paid")
        : "all",
    sortBy: VALID_SORTS.has(sortParam)
      ? (sortParam as CourseFilterValues["sortBy"])
      : "newest",
  };

  const [catalog, facets] = await Promise.all([
    getCachedCatalog({
      locale,
      page: 1,
      pageSize: PAGE_SIZE_DEFAULT,
      search: initialFilters.search,
      category: initialFilters.category,
      difficulty: initialFilters.difficulty,
      priceRange: initialFilters.priceRange,
      // VALID_SORTS gate above narrowed the value to the catalog union, but
      // `CourseFilterValues["sortBy"]` is `string` (UI-driven shape), so we
      // re-cast at the boundary instead of widening the server-side type.
      sortBy: initialFilters.sortBy as CatalogFilters["sortBy"],
    }),
    getCachedFacets(locale),
  ]);

  return (
    <CourseCatalogClient
      initialFilters={initialFilters}
      initialData={{ courses: catalog.courses, totalCount: catalog.totalCount }}
      initialFacets={facets}
    />
  );
}
