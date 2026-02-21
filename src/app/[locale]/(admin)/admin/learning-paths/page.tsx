"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { LearningPathForm } from "@/components/admin/LearningPathForm";
import type { LearningPathInput } from "@/lib/utils/validators";
import type { LearningPath, DifficultyLevel } from "@/types";

interface LearningPathWithCourseCount extends LearningPath {
  course_count?: number;
  category_name?: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 100);
}

export default function AdminLearningPathsPage() {
  const [paths, setPaths] = useState<LearningPathWithCourseCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPath, setEditingPath] = useState<LearningPathWithCourseCount | null>(null);
  const [editingCourses, setEditingCourses] = useState<
    Array<{ courseId: string; sortOrder: number; isRequired: boolean }>
  >([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchPaths();
  }, []);

  async function fetchPaths() {
    setIsLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("learning_paths")
      .select(
        `
        *,
        categories:category_id (name),
        learning_path_courses (id)
      `
      )
      .order("sort_order", { ascending: true });

    const mapped: LearningPathWithCourseCount[] = (data ?? []).map(
      (p: Record<string, unknown>) => ({
        ...(p as unknown as LearningPath),
        course_count: Array.isArray(p.learning_path_courses)
          ? p.learning_path_courses.length
          : 0,
        category_name:
          p.categories &&
          typeof p.categories === "object" &&
          "name" in (p.categories as Record<string, unknown>)
            ? (p.categories as Record<string, string>).name
            : undefined,
      })
    );

    setPaths(mapped);
    setIsLoading(false);
  }

  async function handleEdit(path: LearningPathWithCourseCount) {
    // Fetch associated courses for the form
    const supabase = createClient();
    const { data: pathCourses } = await supabase
      .from("learning_path_courses")
      .select("course_id, sort_order, is_required")
      .eq("learning_path_id", path.id)
      .order("sort_order");

    setEditingCourses(
      (pathCourses ?? []).map((c: Record<string, unknown>) => ({
        courseId: c.course_id as string,
        sortOrder: c.sort_order as number,
        isRequired: c.is_required as boolean,
      }))
    );
    setEditingPath(path);
    setShowForm(true);
  }

  async function handleSave(data: LearningPathInput) {
    setIsSaving(true);
    const supabase = createClient();

    const slug =
      editingPath?.slug ?? slugify(data.title) + "-" + Date.now().toString(36);

    const dbData = {
      title: data.title,
      title_ar: data.titleAr || null,
      description: data.description || null,
      description_ar: data.descriptionAr || null,
      slug,
      difficulty_level: data.difficultyLevel,
      category_id: data.categoryId || null,
      estimated_hours: data.estimatedHours,
      is_published: data.isPublished,
      is_featured: data.isFeatured,
      sort_order: data.sortOrder,
    };

    let pathId = editingPath?.id;

    if (editingPath) {
      await supabase
        .from("learning_paths")
        .update(dbData)
        .eq("id", editingPath.id);
    } else {
      const { data: inserted } = await supabase
        .from("learning_paths")
        .insert(dbData)
        .select("id")
        .single();
      pathId = inserted?.id;
    }

    // Save courses: delete existing, re-insert
    if (pathId) {
      await supabase
        .from("learning_path_courses")
        .delete()
        .eq("learning_path_id", pathId);

      if (data.courses && data.courses.length > 0) {
        const courseRows = data.courses
          .filter((c) => c.courseId)
          .map((c) => ({
            learning_path_id: pathId!,
            course_id: c.courseId,
            sort_order: c.sortOrder,
            is_required: c.isRequired,
          }));

        if (courseRows.length > 0) {
          await supabase.from("learning_path_courses").insert(courseRows);
        }
      }
    }

    setShowForm(false);
    setEditingPath(null);
    setEditingCourses([]);
    setIsSaving(false);
    await fetchPaths();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this learning path?")) return;
    const supabase = createClient();
    await supabase.from("learning_paths").delete().eq("id", id);
    await fetchPaths();
  }

  async function handleTogglePublished(path: LearningPathWithCourseCount) {
    const supabase = createClient();
    await supabase
      .from("learning_paths")
      .update({ is_published: !path.is_published })
      .eq("id", path.id);
    await fetchPaths();
  }

  function getDifficultyBadge(level?: DifficultyLevel | null) {
    switch (level) {
      case "beginner":
        return <Badge variant="success">Beginner</Badge>;
      case "intermediate":
        return <Badge variant="info">Intermediate</Badge>;
      case "advanced":
        return <Badge variant="warning">Advanced</Badge>;
      case "expert":
        return <Badge variant="destructive">Expert</Badge>;
      default:
        return <Badge variant="secondary">—</Badge>;
    }
  }

  const columns: Column<LearningPathWithCourseCount>[] = [
    {
      key: "title",
      header: "Title",
      render: (item) => (
        <div>
          <span className="font-semibold">{item.title}</span>
          {item.title_ar && (
            <span className="ms-2 text-xs text-muted-foreground" dir="rtl">
              {item.title_ar}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (item) => (
        <span className="text-sm">
          {item.category_name ?? "—"}
        </span>
      ),
    },
    {
      key: "difficulty",
      header: "Difficulty",
      render: (item) => getDifficultyBadge(item.difficulty_level),
    },
    {
      key: "courses",
      header: "Courses",
      render: (item) => (
        <span className="text-sm font-medium">{item.course_count ?? 0}</span>
      ),
    },
    {
      key: "enrollments",
      header: "Enrollments",
      render: (item) => (
        <span className="text-sm">{item.enrollment_count}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item) => (
        <div className="flex gap-1">
          {item.is_published ? (
            <Badge variant="success">Published</Badge>
          ) : (
            <Badge variant="secondary">Draft</Badge>
          )}
          {item.is_featured && <Badge variant="info">Featured</Badge>}
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-36",
      render: (item) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => handleEdit(item)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => handleTogglePublished(item)}
          >
            {item.is_published ? "Unpublish" : "Publish"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-destructive"
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
        <h1 className="font-heading text-2xl font-bold">Learning Paths</h1>
        <Button
          onClick={() => {
            setEditingPath(null);
            setEditingCourses([]);
            setShowForm(!showForm);
          }}
        >
          <Plus className="h-4 w-4 me-2" />
          Create Learning Path
        </Button>
      </div>

      {showForm && (
        <LearningPathForm
          initialData={
            editingPath
              ? {
                  id: editingPath.id,
                  title: editingPath.title,
                  titleAr: editingPath.title_ar ?? undefined,
                  description: editingPath.description ?? undefined,
                  descriptionAr: editingPath.description_ar ?? undefined,
                  difficultyLevel:
                    editingPath.difficulty_level ?? "beginner",
                  categoryId: editingPath.category_id ?? undefined,
                  estimatedHours: editingPath.estimated_hours,
                  isPublished: editingPath.is_published,
                  isFeatured: editingPath.is_featured,
                  sortOrder: editingPath.sort_order,
                  courses: editingCourses,
                }
              : undefined
          }
          onSubmit={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingPath(null);
            setEditingCourses([]);
          }}
          isLoading={isSaving}
        />
      )}

      <Card>
        <CardHeader />
        <CardContent>
          <DataTable
            columns={columns}
            data={paths}
            isLoading={isLoading}
            rowKey={(item) => item.id}
            emptyMessage="No learning paths yet. Create one to get started."
          />
        </CardContent>
      </Card>
    </div>
  );
}
