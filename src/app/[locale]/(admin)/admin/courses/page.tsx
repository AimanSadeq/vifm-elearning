"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Eye, Pencil, Trash2, ClipboardCheck, ToggleLeft, ToggleRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { reportSupabaseError } from "@/lib/utils/supabase-error";
import { escapeIlike } from "@/lib/utils/escape-search";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { SearchBar } from "@/components/shared/SearchBar";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { formatCurrency } from "@/lib/utils/formatters";
import type { Course } from "@/types";

export default function AdminCoursesPage() {
  const t = useTranslations("admin");
  const locale = useLocale();

  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    async function fetchCourses() {
      setIsLoading(true);
      const supabase = createClient();

      let query = supabase
        .from("courses")
        .select(
          `
          *,
          category:categories(name, name_ar, slug),
          instructor:profiles!courses_instructor_id_fkey(full_name)
        `
        )
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (debouncedSearch) {
        const s = escapeIlike(debouncedSearch);
        query = query.or(
          `title.ilike.%${s}%,title_ar.ilike.%${s}%`
        );
      }

      const { data, error } = await query;
      if (error) {
        reportSupabaseError(error, "Could not load courses");
        setCourses([]);
      } else {
        setCourses((data as Course[]) ?? []);
      }
      setIsLoading(false);
    }

    fetchCourses();
  }, [debouncedSearch, statusFilter]);

  const handleDelete = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;

    const supabase = createClient();
    const { error } = await supabase.from("courses").delete().eq("id", courseId);

    if (error) {
      alert("Failed to delete course: " + error.message);
      return;
    }

    setCourses((prev) => prev.filter((c) => c.id !== courseId));
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
        <CardHeader>
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
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={courses}
            isLoading={isLoading}
            rowKey={(item) => item.id}
            emptyMessage="No courses found. Create your first course!"
          />
        </CardContent>
      </Card>
    </div>
  );
}
