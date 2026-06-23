import "server-only";
import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { escapeIlike } from "@/lib/utils/escape-search";
import type { Course } from "@/types";

/**
 * Server-side catalog fetchers used by the public courses page to render
 * the first paint with data already in the HTML, instead of waiting for a
 * client-side `useEffect` to fire.
 *
 * Wrapped in `unstable_cache` with a 60s revalidate window — the catalog
 * doesn't change second-by-second, so repeating identical fetches across
 * users for one minute is a clear win. The cache key is derived from the
 * function args by Next.js, so different locales / filter combos get
 * separate entries automatically.
 *
 * Uses the public anon key with no session so it sees exactly what an
 * unauthenticated visitor would see (i.e. RLS-filtered to published rows).
 */

const PAGE_SIZE_DEFAULT = 12;

function anonClient() {
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );
}

export interface CatalogFilters {
  search?: string;
  category?: string; // slug; "all" / "" means no filter
  difficulty?: string; // "all" / "" means no filter
  priceRange?: "free" | "paid" | "all";
  sortBy?: "newest" | "popular" | "highest_rated" | "price_asc" | "price_desc";
}

export interface CatalogResult {
  courses: Course[];
  totalCount: number;
  totalPages: number;
}

interface FetchArgs extends CatalogFilters {
  locale: string;
  page: number;
  pageSize: number;
}

async function fetchCatalogImpl(args: FetchArgs): Promise<CatalogResult> {
  const supabase = anonClient();

  // PostgREST can't filter parent rows by joined-table columns, so resolve
  // the category slug → id once before composing the main query.
  let categoryId: string | null = null;
  if (args.category && args.category !== "all") {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", args.category)
      .maybeSingle();
    // No-match sentinel: forces zero results rather than silently dropping
    // the category constraint. Same pattern as the client hook.
    categoryId = cat?.id ?? "__no_match__";
  }

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
    .eq("status", "published");

  // Locale gating: a course only appears in the EN catalog if its title
  // contains Latin script, AR if Arabic. Mirrors the client hook so SSR
  // and client refetches stay in sync.
  if (args.locale === "ar") {
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

  if (args.search) {
    const s = escapeIlike(args.search);
    query = query.or(
      `title.ilike.%${s}%,title_ar.ilike.%${s}%,description.ilike.%${s}%,description_ar.ilike.%${s}%`
    );
  }

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  if (args.difficulty && args.difficulty !== "all") {
    query = query.eq("difficulty_level", args.difficulty);
  }

  if (args.priceRange === "free") {
    query = query.eq("is_free", true);
  } else if (args.priceRange === "paid") {
    query = query.eq("is_free", false);
  }

  switch (args.sortBy) {
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
      query = query.order("created_at", { ascending: false });
      break;
  }

  const from = (args.page - 1) * args.pageSize;
  const to = from + args.pageSize - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;
  if (error) {
    // Don't throw — first paint should never 500 the catalog page. Log and
    // hand the client a clean empty state; the client hook will refetch.
    console.error("[catalog-data] fetchCatalogImpl error", error);
    return { courses: [], totalCount: 0, totalPages: 0 };
  }

  const total = count ?? 0;
  return {
    courses: (data as Course[]) ?? [],
    totalCount: total,
    totalPages: Math.ceil(total / args.pageSize),
  };
}

export const getCachedCatalog = unstable_cache(
  fetchCatalogImpl,
  ["catalog-v1"],
  { revalidate: 60, tags: ["courses"] }
);

// ---------- Facets ----------

export interface CatalogFacets {
  difficultyCounts: Record<string, number>;
  availableDifficulties: string[];
  categoryCount: number;
  publishedTotal: number;
  freeCount: number;
}

async function fetchFacetsImpl(locale: string): Promise<CatalogFacets> {
  const supabase = anonClient();

  let coursesQ = supabase
    .from("courses")
    .select("difficulty_level, is_free")
    .eq("status", "published");

  if (locale === "ar") {
    coursesQ = coursesQ
      .not("title_ar", "is", null)
      .neq("title_ar", "")
      .filter("title_ar", "match", "[؀-ۿ]");
  } else {
    coursesQ = coursesQ
      .not("title", "is", null)
      .neq("title", "")
      .filter("title", "match", "[A-Za-z]");
  }

  const [{ data: courses }, { data: publishedCatRows }] = await Promise.all([
    coursesQ,
    // Count only categories that actually have a published course.
    supabase.from("courses").select("category_id").eq("status", "published"),
  ]);
  const categoryCount = new Set(
    (publishedCatRows ?? [])
      .map((r) => (r as { category_id: string | null }).category_id)
      .filter(Boolean)
  ).size;

  const difficultyCounts: Record<string, number> = {};
  let freeCount = 0;
  for (const c of (courses ?? []) as Array<{
    difficulty_level: string | null;
    is_free: boolean | null;
  }>) {
    if (c.difficulty_level) {
      difficultyCounts[c.difficulty_level] =
        (difficultyCounts[c.difficulty_level] ?? 0) + 1;
    }
    if (c.is_free) freeCount += 1;
  }
  const order = ["gateway", "professional", "executive", "expert"];
  const availableDifficulties = order.filter(
    (d) => (difficultyCounts[d] ?? 0) > 0
  );

  return {
    difficultyCounts,
    availableDifficulties,
    categoryCount,
    publishedTotal: courses?.length ?? 0,
    freeCount,
  };
}

export const getCachedFacets = unstable_cache(
  fetchFacetsImpl,
  ["catalog-facets-v1"],
  { revalidate: 60, tags: ["courses"] }
);

// ============================================================
//  Category page (single category by slug)
// ============================================================

export interface CategoryRow {
  id: string;
  name: string;
  name_ar: string | null;
  slug: string;
  color: string | null;
  description: string | null;
  description_ar: string | null;
}

export interface CategorySibling {
  id: string;
  name: string;
  name_ar: string | null;
  slug: string;
  color: string | null;
  count: number;
}

export interface CategoryFacets {
  difficulties: Record<string, number>;
  freeCount: number;
}

async function fetchCategoryBySlugImpl(
  slug: string
): Promise<CategoryRow | null> {
  const supabase = anonClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name, name_ar, slug, color, description, description_ar")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  return (data as CategoryRow | null) ?? null;
}

export const getCachedCategoryBySlug = unstable_cache(
  fetchCategoryBySlugImpl,
  ["category-by-slug-v1"],
  { revalidate: 60, tags: ["categories"] }
);

async function fetchCategorySiblingsImpl(
  excludeCategoryId: string
): Promise<CategorySibling[]> {
  const supabase = anonClient();
  const { data: cats } = await supabase
    .from("categories")
    .select("id, name, name_ar, slug, color")
    .eq("is_active", true);

  if (!cats) return [];

  // Per-sibling count fan-out, but we run inside `unstable_cache` with a 60s
  // window — a category sidebar this big still amortises to one fan-out per
  // minute per process. If the category list ever explodes, replace with an
  // RPC that returns counts in a single query.
  const others = cats.filter((c) => c.id !== excludeCategoryId);
  const counts = await Promise.all(
    others.map(async (c) => {
      const { count } = await supabase
        .from("courses")
        .select("*", { count: "exact", head: true })
        .eq("category_id", c.id)
        .eq("status", "published");
      return { ...(c as Omit<CategorySibling, "count">), count: count ?? 0 };
    })
  );

  return counts.filter((c) => c.count > 0).sort((a, b) => b.count - a.count);
}

export const getCachedCategorySiblings = unstable_cache(
  fetchCategorySiblingsImpl,
  ["category-siblings-v1"],
  { revalidate: 60, tags: ["categories", "courses"] }
);

async function fetchCategoryFacetsImpl(
  categoryId: string
): Promise<CategoryFacets> {
  const supabase = anonClient();
  const { data: rows } = await supabase
    .from("courses")
    .select("difficulty_level, is_free")
    .eq("category_id", categoryId)
    .eq("status", "published");

  const difficulties: Record<string, number> = {};
  let freeCount = 0;
  for (const r of (rows ?? []) as Array<{
    difficulty_level: string | null;
    is_free: boolean | null;
  }>) {
    if (r.difficulty_level) {
      difficulties[r.difficulty_level] =
        (difficulties[r.difficulty_level] ?? 0) + 1;
    }
    if (r.is_free) freeCount += 1;
  }
  return { difficulties, freeCount };
}

export const getCachedCategoryFacets = unstable_cache(
  fetchCategoryFacetsImpl,
  ["category-facets-v1"],
  { revalidate: 60, tags: ["categories", "courses"] }
);

interface CategoryCoursesArgs {
  categoryId: string;
  locale: string;
  search?: string;
  difficulty?: string;
  priceRange?: "free" | "paid" | "all";
  sortBy?: "newest" | "popular" | "highest_rated" | "price_asc" | "price_desc";
  page: number;
  pageSize: number;
}

async function fetchCategoryCoursesImpl(
  args: CategoryCoursesArgs
): Promise<CatalogResult> {
  const supabase = anonClient();

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
    .eq("category_id", args.categoryId);

  if (args.locale === "ar") {
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

  if (args.search) {
    const s = escapeIlike(args.search);
    query = query.or(
      `title.ilike.%${s}%,title_ar.ilike.%${s}%,description.ilike.%${s}%`
    );
  }

  if (args.difficulty && args.difficulty !== "all") {
    query = query.eq("difficulty_level", args.difficulty);
  }

  if (args.priceRange === "free") query = query.eq("is_free", true);
  else if (args.priceRange === "paid") query = query.eq("is_free", false);

  switch (args.sortBy) {
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

  const from = (args.page - 1) * args.pageSize;
  const to = from + args.pageSize - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;
  if (error) {
    console.error("[catalog-data] fetchCategoryCoursesImpl error", error);
    return { courses: [], totalCount: 0, totalPages: 0 };
  }
  const total = count ?? 0;
  return {
    courses: (data as Course[]) ?? [],
    totalCount: total,
    totalPages: Math.ceil(total / args.pageSize),
  };
}

export const getCachedCategoryCourses = unstable_cache(
  fetchCategoryCoursesImpl,
  ["category-courses-v1"],
  { revalidate: 60, tags: ["categories", "courses"] }
);

// ============================================================
//  Designations (public listing page)
// ============================================================

export interface DesignationListRow {
  id: string;
  name: string;
  name_ar: string | null;
  slug: string;
  abbreviation: string;
  description: string | null;
  description_ar: string | null;
  founding_fee: number;
  currency: string;
  metadata: { tier_level?: string } | null;
}

async function fetchDesignationsImpl(): Promise<DesignationListRow[]> {
  const supabase = anonClient();
  const { data, error } = await supabase
    .from("designations")
    .select(
      "id, name, name_ar, slug, abbreviation, description, description_ar, founding_fee, currency, metadata"
    )
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("[catalog-data] fetchDesignationsImpl error", error);
    return [];
  }
  return (data as DesignationListRow[]) ?? [];
}

export const getCachedDesignations = unstable_cache(
  fetchDesignationsImpl,
  ["designations-list-v1"],
  { revalidate: 60, tags: ["designations"] }
);

// ----- Designation detail page (by slug) -----

export interface DesignationDetail {
  id: string;
  name: string;
  name_ar: string | null;
  slug: string;
  abbreviation: string;
  description: string | null;
  description_ar: string | null;
  founding_fee: number;
  renewal_fee: number;
  late_fee: number;
  currency: string | null;
  annual_cpe_required: number;
  renewal_month: number;
  renewal_day: number;
  grace_period_months: number;
  metadata: Record<string, unknown> | null;
}

export interface DesignationDocumentRow {
  id: string;
  title: string;
  title_ar: string | null;
  description: string | null;
  sort_order: number;
}

export interface CPECategoryRow {
  id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  annual_max_hours: number | null;
  requires_approval: boolean;
  sort_order: number;
}

async function fetchDesignationBySlugImpl(
  slug: string
): Promise<DesignationDetail | null> {
  const supabase = anonClient();
  const { data } = await supabase
    .from("designations")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  return (data as DesignationDetail | null) ?? null;
}

export const getCachedDesignationBySlug = unstable_cache(
  fetchDesignationBySlugImpl,
  ["designation-by-slug-v1"],
  { revalidate: 60, tags: ["designations"] }
);

interface DesignationDetailBundle {
  documents: DesignationDocumentRow[];
  cpeCategories: CPECategoryRow[];
  resources: unknown[]; // upstream type lives in @/types — keep loose here
  holderCount: number;
  primaryCourseSlug: string | null;
}

async function fetchDesignationBundleImpl(
  designationId: string
): Promise<DesignationDetailBundle> {
  const supabase = anonClient();

  const [docsRes, catsRes, resourcesRes, holderCountRes, primaryCourseRes] =
    await Promise.all([
      supabase
        .from("designation_documents")
        .select("id, title, title_ar, description, sort_order")
        .eq("designation_id", designationId)
        .order("sort_order"),
      supabase
        .from("cpe_categories")
        .select(
          "id, name, name_ar, description, annual_max_hours, requires_approval, sort_order"
        )
        .eq("designation_id", designationId)
        .order("sort_order"),
      supabase
        .from("designation_resources")
        .select("*")
        .eq("designation_id", designationId)
        .eq("is_active", true)
        .order("sort_order"),
      supabase
        .from("designation_holders")
        .select("id", { count: "exact", head: true })
        .eq("designation_id", designationId)
        .in("status", ["active", "grace_period"]),
      supabase
        .from("courses")
        .select("slug")
        .eq("designation_id", designationId)
        .eq("status", "published")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);

  return {
    documents: ((docsRes.data ?? []) as DesignationDocumentRow[]) ?? [],
    cpeCategories: ((catsRes.data ?? []) as CPECategoryRow[]) ?? [],
    resources: (resourcesRes.data ?? []) as unknown[],
    holderCount: holderCountRes.count ?? 0,
    primaryCourseSlug:
      ((primaryCourseRes.data as { slug: string } | null)?.slug) ?? null,
  };
}

export const getCachedDesignationBundle = unstable_cache(
  fetchDesignationBundleImpl,
  ["designation-bundle-v1"],
  { revalidate: 60, tags: ["designations", "courses"] }
);

export { PAGE_SIZE_DEFAULT };
