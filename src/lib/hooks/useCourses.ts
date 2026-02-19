"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Course } from "@/types";
import type { CourseFilterValues } from "@/components/courses/CourseFilters";

interface UseCoursesCatalogOptions {
  filters: CourseFilterValues;
  page?: number;
  pageSize?: number;
}

interface UseCoursesCatalogResult {
  courses: Course[];
  isLoading: boolean;
  totalCount: number;
  totalPages: number;
}

export function useCoursesCatalog({
  filters,
  page = 1,
  pageSize = 12,
}: UseCoursesCatalogOptions): UseCoursesCatalogResult {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Serialize filters to a stable string to avoid re-fetching on every render
  const filterKey = JSON.stringify(filters);
  const prevFilterKey = useRef(filterKey);
  const isFirstRender = useRef(true);

  useEffect(() => {
    let cancelled = false;

    // Only show loading skeleton on first render or when filters actually changed
    if (isFirstRender.current || prevFilterKey.current !== filterKey) {
      setIsLoading(true);
      prevFilterKey.current = filterKey;
      isFirstRender.current = false;
    }

    async function fetchCourses() {
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
        .eq("status", "published");

      // Apply filters
      if (filters.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,title_ar.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        );
      }

      if (filters.category && filters.category !== "all") {
        query = query.eq("category:categories.slug", filters.category);
      }

      if (filters.difficulty && filters.difficulty !== "all") {
        query = query.eq("difficulty_level", filters.difficulty);
      }

      if (filters.priceRange === "free") {
        query = query.eq("is_free", true);
      } else if (filters.priceRange === "paid") {
        query = query.eq("is_free", false);
      }

      // Sorting
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
          query = query.order("created_at", { ascending: false });
          break;
      }

      // Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (cancelled) return;

      if (error) {
        console.error("Error fetching courses:", error);
        setCourses([]);
        setTotalCount(0);
      } else {
        setCourses((data as Course[]) ?? []);
        setTotalCount(count ?? 0);
      }

      setIsLoading(false);
    }

    fetchCourses();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, page, pageSize]);

  return {
    courses,
    isLoading,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}

export function useFeaturedCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchFeatured() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("courses")
        .select(
          `
          *,
          category:categories(id, name, name_ar, slug, color),
          instructor:profiles!courses_instructor_id_fkey(full_name, full_name_ar, avatar_url)
        `
        )
        .eq("status", "published")
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
        .limit(6);

      if (cancelled) return;

      if (error) {
        console.error("Error fetching featured courses:", error);
      } else {
        setCourses((data as Course[]) ?? []);
      }
      setIsLoading(false);
    }

    fetchFeatured();

    return () => {
      cancelled = true;
    };
  }, []);

  return { courses, isLoading };
}

export function useCourseBySlug(slug: string) {
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchCourse() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("courses")
        .select(
          `
          *,
          category:categories(id, name, name_ar, slug, color),
          instructor:profiles!courses_instructor_id_fkey(full_name, full_name_ar, avatar_url)
        `
        )
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (cancelled) return;

      if (error) {
        console.error("Error fetching course:", error);
      } else {
        setCourse(data as Course);
      }
      setIsLoading(false);
    }

    if (slug) fetchCourse();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { course, isLoading };
}
