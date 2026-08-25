"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  ClipboardCheck,
  ToggleLeft,
  ToggleRight,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { reportSupabaseError } from "@/lib/utils/supabase-error";
import { escapeIlike } from "@/lib/utils/escape-search";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { SearchBar } from "@/components/shared/SearchBar";
import { TablePagination } from "@/components/shared/TablePagination";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { formatCurrency } from "@/lib/utils/formatters";
import type { Category, Course, DifficultyLevel } from "@/types";

const PAGE_SIZE = 25;

const LEVEL_OPTIONS: { value: DifficultyLevel; label: string }[] = [
  { value: "gateway", label: "Gateway" },
  { value: "professional", label: "Professional" },
  { value: "executive", label: "Executive" },
  { value: "expert", label: "Expert" },
];

type SortOption = "newest" | "oldest" | "title" | "enrollments";

const SORT_OPTIONS: {
  value: SortOption;
  label: string;
  column: string;
  ascending: boolean;
}[] = [
  { value: "newest", label: "Newest first", column: "created_at", ascending: false },
  { value: "oldest", label: "Oldest first", column: "created_at", ascending: true },
  { value: "title", label: "Title A–Z", column: "title", ascending: true },
  {
    value: "enrollments",
    label: "Most students",
    column: "enrollment_count",
    ascending: false,
  },
];

export default function AdminCoursesPage() {
  const t = useTranslations("admin");
  const locale = useLocale();

  const [courses, setCourses] = useState<Course[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [instructorFilter, setInstructorFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [sort, setSort] = useState<SortOption>("newest");
  const [page, setPage] = useState(0);
  const debouncedSearch = useDebounce(search, 300);

  // Filter dropdown options
  const [categories, setCategories] = useState<Category[]>([]);
  const [instructors, setInstructors] = useState<
    { id: string; full_name: string }[]
  >([]);

  const activeFilterCount =
    (statusFilter !== "all" ? 1 : 0) +
    (categoryFilter !== "all" ? 1 : 0) +
    (instructorFilter !== "all" ? 1 : 0) +
    (levelFilter !== "all" ? 1 : 0) +
    (priceFilter !== "all" ? 1 : 0) +
    (search ? 1 : 0);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setInstructorFilter("all");
    setLevelFilter("all");
    setPriceFilter("all");
  };

  // Reset to first page whenever filters/search change so we don't end up
  // on an out-of-range page after the result set shrinks.
  useEffect(() => {
    setPage(0);
  }, [
    debouncedSearch,
    statusFilter,
    categoryFilter,
    instructorFilter,
    levelFilter,
    priceFilter,
    sort,
  ]);

  // Dropdown options are static for the session — fetch them once.
  useEffect(() => {
    async function fetchFilterOptions() {
      const supabase = createClient();

      const [{ data: categoryRows }, { data: instructorRows }] = await Promise.all([
        supabase
          .from("categories")
          .select("*")
          .eq("is_active", true)
          .order("sort_order"),
        supabase
          .from("profiles")
          .select("id, full_name")
          .in("role", ["super_admin", "instructor"])
          .eq("is_active", true)
          .order("full_name"),
      ]);

      setCategories((categoryRows as Category[]) ?? []);
      setInstructors(
        (instructorRows as { id: string; full_name: string }[]) ?? []
      );
    }

    fetchFilterOptions();
  }, []);

  useEffect(() => {
    async function fetchCourses() {
      setIsLoading(true);
      const supabase = createClient();

      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const sortOption =
        SORT_OPTIONS.find((o) => o.value === sort) ?? SORT_OPTIONS[0];

      let query = supabase
        .from("courses")
        .select(
          `
          *,
          category:categories(name, name_ar, slug),
          instructor:profiles!courses_instructor_id_fkey(full_name)
        `,
          { count: "exact" }
        )
        // Arabic-only rows have a null title; keep them at the end of an
        // A–Z sort instead of letting Postgres float the nulls to the top.
        .order(sortOption.column, {
          ascending: sortOption.ascending,
          nullsFirst: false,
        })
        .range(from, to);

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (categoryFilter !== "all") {
        query = query.eq("category_id", categoryFilter);
      }

      if (instructorFilter === "unassigned") {
        query = query.is("instructor_id", null);
      } else if (instructorFilter !== "all") {
        query = query.eq("instructor_id", instructorFilter);
      }

      if (levelFilter !== "all") {
        query = query.eq("difficulty_level", levelFilter);
      }

      if (priceFilter !== "all") {
        query = query.eq("is_free", priceFilter === "free");
      }

      if (debouncedSearch) {
        const s = escapeIlike(debouncedSearch);
        query = query.or(
          `title.ilike.%${s}%,title_ar.ilike.%${s}%`
        );
      }

      const { data, error, count } = await query;
      if (error) {
        reportSupabaseError(error, "Could not load courses");
        setCourses([]);
        setTotalCount(0);
      } else {
        setCourses((data as Course[]) ?? []);
        setTotalCount(count ?? 0);
      }
      setIsLoading(false);
    }

    fetchCourses();
  }, [
    debouncedSearch,
    statusFilter,
    categoryFilter,
    instructorFilter,
    levelFilter,
    priceFilter,
    sort,
    page,
  ]);

  const handleDelete = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;

    const supabase = createClient();
    const { error } = await supabase.from("courses").delete().eq("id", courseId);

    if (error) {
      alert("Failed to delete course: " + error.message);
      return;
    }

    setCourses((prev) => prev.filter((c) => c.id !== courseId));
    setTotalCount((c) => Math.max(0, c - 1));
  };

  const handleToggleStatus = async (course: Course) => {
    const newStatus = course.status === "published" ? "draft" : "published";
    const supabase = createClient();

    const updateData: Record<string, unknown> = { status: newStatus };
    if (newStatus === "published" && !course.published_at) {
      updateData.published_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("courses")
      .update(updateData)
      .eq("id", course.id);

    if (error) {
      alert("Failed to update course status: " + error.message);
      return;
    }

    setCourses((prev) =>
      prev.map((c) =>
        c.id === course.id ? { ...c, status: newStatus } : c
      )
    );
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge variant="success">Published</Badge>;
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "archived":
        return <Badge variant="warning">Archived</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const columns: Column<Course>[] = [
    {
      key: "title",
      header: "Course",
      render: (item) => {
        // The schema allows EN-only or AR-only courses (one title may be
        // null). Without a fallback the table cell renders empty for
        // Arabic-only rows, even though the row exists in the catalog.
        // Browsers handle Arabic glyphs correctly inside an LTR container
        // via Unicode BiDi, so we deliberately don't set `dir` here —
        // doing so would right-align the title and break the column flow.
        const displayTitle =
          (locale === "ar"
            ? item.title_ar || item.title
            : item.title || item.title_ar) || "(Untitled)";
        return (
          <div>
            <Link
              href={`/${locale}/admin/courses/${item.id}/edit`}
              className="font-medium hover:text-primary hover:underline line-clamp-1"
            >
              {displayTitle}
            </Link>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {(item.category as unknown as { name: string })?.name ?? "—"}
            </p>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (item) => statusBadge(item.status),
    },
    {
      key: "price",
      header: "Price",
      render: (item) => (
        <span className="whitespace-nowrap">
          {item.is_free ? "Free" : formatCurrency(item.price, item.currency)}
        </span>
      ),
    },
    {
      key: "enrollments",
      header: "Students",
      render: (item) => <span>{item.enrollment_count}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      className: "whitespace-nowrap",
      render: (item) => (
        <div className="flex items-center gap-1">
          <Link href={`/${locale}/courses/${item.slug}`} title="View public page">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/${locale}/admin/courses/${item.id}/edit`} title="Edit">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/${locale}/admin/courses/${item.id}/quizzes`} title="Manage Quizzes">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ClipboardCheck className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => handleToggleStatus(item)}
            title={item.status === "published" ? "Unpublish" : "Publish"}
          >
            {item.status === "published" ? (
              <ToggleRight className="h-4 w-4 text-success" />
            ) : (
              <ToggleLeft className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-error hover:text-error"
            onClick={() => handleDelete(item.id)}
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">
          {t("manageCourses")}
        </h1>
        <Link href={`/${locale}/admin/courses/new`}>
          <Button>
            <Plus className="h-4 w-4 me-2" />
            {t("createCourse")}
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search courses..."
              className="w-full sm:max-w-sm"
            />
            <div className="flex items-center gap-2">
              {["all", "published", "draft", "archived"].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-52" aria-label="Filter by category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {locale === "ar" ? category.name_ar || category.name : category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={instructorFilter} onValueChange={setInstructorFilter}>
              <SelectTrigger className="w-full sm:w-52" aria-label="Filter by instructor">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All instructors</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {instructors.map((instructor) => (
                  <SelectItem key={instructor.id} value={instructor.id}>
                    {instructor.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-full sm:w-40" aria-label="Filter by level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All levels</SelectItem>
                {LEVEL_OPTIONS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priceFilter} onValueChange={setPriceFilter}>
              <SelectTrigger className="w-full sm:w-36" aria-label="Filter by price">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Free & paid</SelectItem>
                <SelectItem value="free">Free only</SelectItem>
                <SelectItem value="paid">Paid only</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
              <SelectTrigger className="w-full sm:w-44" aria-label="Sort courses">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 me-1" />
                Clear filters ({activeFilterCount})
              </Button>
            )}

            {!isLoading && (
              <span className="ms-auto text-sm text-muted-foreground">
                {totalCount} {totalCount === 1 ? "course" : "courses"}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={courses}
            isLoading={isLoading}
            rowKey={(item) => item.id}
            emptyMessage="No courses found. Create your first course!"
          />
          <TablePagination
            page={page}
            pageSize={PAGE_SIZE}
            totalCount={totalCount}
            isLoading={isLoading}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
