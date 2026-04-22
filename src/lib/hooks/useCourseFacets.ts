"use client";

import { useEffect, useState } from "react";
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

export function useCourseFacets(): CourseFacets {
  const [state, setState] = useState<CourseFacets>(EMPTY);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const supabase = createClient();

      const [{ data: courses }, { count: categoryCount }] = await Promise.all([
        supabase
          .from("courses")
          .select("difficulty_level, is_free")
          .eq("status", "published"),
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
  }, []);

  return state;
}
