"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Plus, MoreHorizontal, Eye, Pencil, Trash2, BookOpen, ClipboardCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { SearchBar } from "@/components/shared/SearchBar";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { formatCurrency, formatRelativeDate } from "@/lib/utils/formatters";
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
        query = query.or(
          `title.ilike.%${debouncedSearch}%,title_ar.ilike.%${debouncedSearch}%`
        );
      }

      const { data } = await query;
      setCourses((data as Course[]) ?? []);
      setIsLoading(false);
    }

    fetchCourses();
  }, [debouncedSearch, statusFilter]);

  const handleDelete = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;

    const supabase = createClient();
    const { error } = await supabase.from("courses").delete().eq("id", courseId);

    if (!error) {
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
    }
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

    if (!error) {
      setCourses((prev) =>
        prev.map((c) =>
          c.id === course.id ? { ...c, status: newStatus } : c
        )
      );
    }
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
      render: (item) => (
        <div className="max-w-xs">
          <p className="font-medium truncate">{item.title}</p>
          <p className="text-xs text-muted-foreground truncate">
            {(item.category as unknown as { name: string })?.name ?? "—"}
          </p>
        </div>
      ),
    },
    {
      key: "instructor",
      header: "Instructor",
      render: (item) => (
        <span className="text-sm">
          {(item.instructor as unknown as { full_name: string })?.full_name ??
            "—"}
        </span>
      ),
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
        <span>
          {item.is_free ? "Free" : formatCurrency(item.price, item.currency)}
        </span>
      ),
    },
    {
      key: "enrollments",
      header: "Enrollments",
      render: (item) => <span>{item.enrollment_count}</span>,
    },
    {
      key: "updated",
      header: "Updated",
      render: (item) => (
        <span className="text-xs text-muted-foreground">
          {formatRelativeDate(item.updated_at)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-40",
      render: (item) => (
        <div className="flex items-center gap-1">
          <Link href={`/${locale}/courses/${item.slug}`}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/${locale}/admin/courses/${item.id}/edit`}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/${locale}/admin/courses/${item.id}/modules`}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <BookOpen className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/${locale}/admin/courses/${item.id}/quizzes`}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ClipboardCheck className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            onClick={() => handleToggleStatus(item)}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-error hover:text-error"
            onClick={() => handleDelete(item.id)}
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
