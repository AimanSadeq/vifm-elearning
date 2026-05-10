"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";

export interface CourseFacets {
  difficultyCounts: Record<string, number>;
  availableDifficulties: string[];
  categoryCount: number;
  publishedTotal: number;
  freeCount: number;
  isLoading: boolean;
}

const EMPTY: CourseFacets = {
  difficultyCounts: {},
  availableDifficulties: [],
  categoryCount: 0,
  publishedTotal: 0,
  freeCount: 0,
  isLoading: true,
};

interface UseCourseFacetsOptions {
  /** Pre-fetched facets from the server — avoids the round-trip on first paint. */
  initialFacets?: Omit<CourseFacets, "isLoading">;
}

export function useCourseFacets(
  options: UseCourseFacetsOptions = {}
): CourseFacets {
  const { initialFacets } = options;
  const locale = useLocale();
  const [state, setState] = useState<CourseFacets>(
    initialFacets ? { ...initialFacets, isLoading: false } : EMPTY
  );
  const hasUsedInitial = useRef(Boolean(initialFacets));

  useEffect(() => {
    let cancelled = false;
    if (hasUsedInitial.current) {
      // SSR data is good for the first paint; don't re-fetch immediately.
      // Locale changes after mount still trigger a fresh fetch.
      hasUsedInitial.current = false;
      return;
    }

    async function run() {
      const supabase = createClient();

      // Restrict facet counts to courses available in the active locale.
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

      const [{ data: courses }, { count: categoryCount }] = await Promise.all([
        coursesQ,
        supabase
          .from("categories")
          .select("*", { count: "exact", head: true }),
      ]);

      if (cancelled) return;

      const difficultyCounts: Record<string, number> = {};
      let freeCount = 0;
      for (const c of courses ?? []) {
        if (c.difficulty_level) {
          difficultyCounts[c.difficulty_level] =
            (difficultyCounts[c.difficulty_level] ?? 0) + 1;
        }
        if (c.is_free) freeCount += 1;
      }

      const order = ["beginner", "intermediate", "advanced", "expert"];
      const availableDifficulties = order.filter(
        (d) => (difficultyCounts[d] ?? 0) > 0
      );

      setState({
        difficultyCounts,
        availableDifficulties,
        categoryCount: categoryCount ?? 0,
        publishedTotal: courses?.length ?? 0,
        freeCount,
        isLoading: false,
      });
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [locale]);

  return state;
}
