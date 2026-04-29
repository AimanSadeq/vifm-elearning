"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, Search, BookOpen, Award, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  type: "course" | "certification";
}

interface GlobalSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchOverlay({
  isOpen,
  onClose,
}: GlobalSearchOverlayProps) {
  const tc = useTranslations("common");
  const locale = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  // Focus input when overlay opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setQuery("");
      setResults([]);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Search when debounced query changes
  const search = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        setResults([]);
        return;
      }

      setIsSearching(true);

      try {
        const supabase = createClient();
        // Escape special PostgREST characters in search term
        const escaped = q.replace(/[%_\\]/g, "\\$&");
        const searchTerm = `%${escaped}%`;

        let courseQ = supabase
          .from("courses")
          .select(
            "id, title, title_ar, slug, short_description, short_description_ar"
          )
          .eq("status", "published")
          .or(`title.ilike.${searchTerm},title_ar.ilike.${searchTerm}`);

        if (locale === "ar") {
          courseQ = courseQ
            .not("title_ar", "is", null)
            .neq("title_ar", "")
            .filter("title_ar", "match", "[؀-ۿ]");
        } else {
          courseQ = courseQ
            .not("title", "is", null)
            .neq("title", "")
            .filter("title", "match", "[A-Za-z]");
        }

        const [coursesRes, designationsRes] = await Promise.all([
          courseQ.limit(5),
          supabase
            .from("designations")
            .select("id, name, name_ar, slug, abbreviation")
            .eq("is_active", true)
            .or(
              `name.ilike.${searchTerm},name_ar.ilike.${searchTerm},abbreviation.ilike.${searchTerm}`
            )
            .limit(5),
        ]);

        const items: SearchResult[] = [];

        if (coursesRes.data) {
          for (const c of coursesRes.data) {
            items.push({
              id: c.id,
              title: locale === "ar" && c.title_ar ? c.title_ar : c.title,
              subtitle:
                locale === "ar" && c.short_description_ar
                  ? c.short_description_ar
                  : c.short_description ?? undefined,
              href: `/${locale}/courses/${c.slug}`,
              type: "course",
            });
          }
        }

        if (designationsRes.data) {
          for (const d of designationsRes.data) {
            items.push({
              id: d.id,
              title: locale === "ar" && d.name_ar ? d.name_ar : d.name,
              subtitle: d.abbreviation,
              href: `/${locale}/designations/${d.slug}`,
              type: "certification",
            });
          }
        }

        setResults(items);
      } catch (err) {
        console.error("[Search] query failed:", err);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [locale]
  );

  useEffect(() => {
    search(debouncedQuery);
  }, [debouncedQuery, search]);

  if (!isOpen) return null;

  const courses = results.filter((r) => r.type === "course");
  const certifications = results.filter((r) => r.type === "certification");
  const hasQuery = query.length >= 2;
  const hasResults = results.length > 0;

  const popularLinks = [
    { label: tc("courses"), href: `/${locale}/courses`, icon: BookOpen },
    { label: tc("certifications"), href: `/${locale}/designations`, icon: Award },
    { label: tc("pricing"), href: `/${locale}/pricing`, icon: ArrowRight },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background/95 backdrop-blur-md">
      {/* Header */}
      <div className="container mx-auto flex items-center gap-4 px-4 py-4">
        <div className="relative flex-1">
          <Search className="absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tc("searchPlaceholder")}
            className="w-full rounded-xl border bg-secondary/50 py-4 ps-12 pe-4 text-lg outline-none placeholder:text-muted-foreground/60 focus:border-brand-300 focus:ring-2 focus:ring-brand-100 transition-colors"
          />
        </div>
        <button
          onClick={onClose}
          className="shrink-0 rounded-lg border p-3 text-muted-foreground hover:bg-secondary transition-colors"
          aria-label="Close search"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 pb-8">
          {isSearching && (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {!isSearching && hasQuery && !hasResults && (
            <p className="py-12 text-center text-muted-foreground">
              {tc("searchNoResults")}
            </p>
          )}

          {!isSearching && hasQuery && hasResults && (
            <div className="space-y-8">
              {courses.length > 0 && (
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    {tc("courses")}
                  </h3>
                  <div className="space-y-1">
                    {courses.map((r) => (
                      <Link
                        key={r.id}
                        href={r.href}
                        onClick={onClose}
                        className="block rounded-lg px-4 py-3 transition-colors hover:bg-secondary"
                      >
                        <p className="font-medium text-foreground">
                          {r.title}
                        </p>
                        {r.subtitle && (
                          <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">
                            {r.subtitle}
                          </p>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {certifications.length > 0 && (
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Award className="h-4 w-4" />
                    {tc("certifications")}
                  </h3>
                  <div className="space-y-1">
                    {certifications.map((r) => (
                      <Link
                        key={r.id}
                        href={r.href}
                        onClick={onClose}
                        className="block rounded-lg px-4 py-3 transition-colors hover:bg-secondary"
                      >
                        <div className="flex items-center gap-3">
                          <span className="inline-flex rounded-md bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-700 dark:bg-brand-900 dark:text-brand-300">
                            {r.subtitle}
                          </span>
                          <p className="font-medium text-foreground">
                            {r.title}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Popular links when no query */}
          {!hasQuery && !isSearching && (
            <div className="py-8">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {tc("popularLinks")}
              </h3>
              <div className="flex flex-wrap gap-3">
                {popularLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={onClose}
                      className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
