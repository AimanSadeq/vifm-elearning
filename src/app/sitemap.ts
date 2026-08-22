import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { APP_URL } from "@/lib/env";

const SITE_URL = APP_URL;
const LOCALES = ["en", "ar"] as const;

// Only paths that resolve to real, indexable content. Deliberately excluded:
//   /categories, /blog — no index route exists (hard 404)
//   /pricing, /learning-paths — currently client-redirect to home when no
//     plans/paths are configured, so listing them creates duplicate-of-home
//     entries. Per-slug /categories/<slug> and /learning-paths/<slug> URLs are
//     still emitted below from live data when they exist.
const STATIC_PATHS = [
  "",
  "/courses",
  "/webinars",
  "/about",
  "/contact",
];

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  const now = new Date();

  for (const locale of LOCALES) {
    for (const path of STATIC_PATHS) {
      entries.push({
        url: `${SITE_URL}/${locale}${path}`,
        lastModified: now,
        changeFrequency: path === "" ? "daily" : "weekly",
        priority: path === "" ? 1.0 : 0.7,
      });
    }
  }

  // Pull dynamic content. We use the anon client server-side so we only see
  // data that's already publicly readable via RLS — no risk of leaking drafts.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url && anon) {
    const supabase = createClient(url, anon, {
      auth: { persistSession: false },
    });

    const [coursesRes, pathsRes, categoriesRes, webinarsRes] = await Promise.all([
      supabase
        .from("courses")
        .select("slug, updated_at, title, title_ar")
        .eq("status", "published")
        .limit(2000),
      supabase
        .from("learning_paths")
        .select("slug, updated_at")
        .eq("is_published", true)
        .limit(500),
      supabase
        .from("categories")
        .select("slug, updated_at")
        .eq("is_active", true)
        .limit(200),
      // Drop "ended" webinars — keeping them produces stale URLs in the
      // sitemap that 404 once recordings are pruned.
      supabase
        .from("webinars")
        .select("id, updated_at")
        .in("status", ["scheduled", "live"])
        .limit(500),
    ]);

    type RowWithSlug = { slug: string; updated_at: string | null };
    type Course = RowWithSlug & { title: string | null; title_ar: string | null };

    for (const c of (coursesRes.data ?? []) as Course[]) {
      // Match the locale-gating done by the public courses pages: only emit
      // /en/ for courses with an English title and /ar/ for courses with Arabic.
      if (c.title) {
        entries.push({
          url: `${SITE_URL}/en/courses/${c.slug}`,
          lastModified: c.updated_at ? new Date(c.updated_at) : now,
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
      if (c.title_ar) {
        entries.push({
          url: `${SITE_URL}/ar/courses/${c.slug}`,
          lastModified: c.updated_at ? new Date(c.updated_at) : now,
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
    }

    for (const p of (pathsRes.data ?? []) as RowWithSlug[]) {
      for (const locale of LOCALES) {
        entries.push({
          url: `${SITE_URL}/${locale}/learning-paths/${p.slug}`,
          lastModified: p.updated_at ? new Date(p.updated_at) : now,
          changeFrequency: "weekly",
          priority: 0.6,
        });
      }
    }

    for (const cat of (categoriesRes.data ?? []) as RowWithSlug[]) {
      for (const locale of LOCALES) {
        entries.push({
          url: `${SITE_URL}/${locale}/categories/${cat.slug}`,
          lastModified: cat.updated_at ? new Date(cat.updated_at) : now,
          changeFrequency: "weekly",
          priority: 0.5,
        });
      }
    }

    for (const w of (webinarsRes.data ?? []) as { id: string; updated_at: string | null }[]) {
      for (const locale of LOCALES) {
        entries.push({
          url: `${SITE_URL}/${locale}/webinars/${w.id}`,
          lastModified: w.updated_at ? new Date(w.updated_at) : now,
          changeFrequency: "weekly",
          priority: 0.5,
        });
      }
    }
  }

  return entries;
}
