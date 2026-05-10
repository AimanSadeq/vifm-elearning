import {
  getCachedCategoryBySlug,
  getCachedCategorySiblings,
  getCachedCategoryFacets,
  getCachedCategoryCourses,
  PAGE_SIZE_DEFAULT,
} from "@/lib/server/catalog-data";
import CategoryClient from "./CategoryClient";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

/**
 * Server-rendered category page. Pre-fetches the category, sibling category
 * sidebar (with course counts), facet counts, and the first page of
 * filtered courses — all wrapped in `unstable_cache` with a 60s window.
 *
 * The client takes over for filter / search / pagination interactions
 * after first paint. If the category slug doesn't exist we still render
 * the client (which owns the localized "not found" UI), passing
 * `category: null`.
 */
export default async function CategoryPage({ params }: PageProps) {
  const { locale, slug } = await params;

  const category = await getCachedCategoryBySlug(slug);

  if (!category) {
    return (
      <CategoryClient
        slug={slug}
        category={null}
        siblings={[]}
        facets={{ difficulties: {}, freeCount: 0 }}
        initialCourses={[]}
        initialTotalCount={0}
      />
    );
  }

  const [siblings, facets, courses] = await Promise.all([
    getCachedCategorySiblings(category.id),
    getCachedCategoryFacets(category.id),
    getCachedCategoryCourses({
      categoryId: category.id,
      locale,
      page: 1,
      pageSize: PAGE_SIZE_DEFAULT,
      // Default filters — match the client's initial state so the SSR
      // result is what the user actually sees on page-1 with no filters.
      search: "",
      difficulty: "all",
      priceRange: "all",
      sortBy: "newest",
    }),
  ]);

  return (
    <CategoryClient
      slug={slug}
      category={category}
      siblings={siblings}
      facets={facets}
      initialCourses={courses.courses}
      initialTotalCount={courses.totalCount}
    />
  );
}
