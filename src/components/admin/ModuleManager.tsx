"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Pencil,
  X,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { LessonForm } from "./LessonForm";
import { createClient } from "@/lib/supabase/client";
import type { Module, Lesson } from "@/types";

interface ModuleManagerProps {
  courseId: string;
  initialModules: Module[];
}

export function ModuleManager({ courseId, initialModules }: ModuleManagerProps) {
  const [modules, setModules] = useState<Module[]>(initialModules);
  const [expandedModule, setExpandedModule] = useState<string | null>(
    modules[0]?.id ?? null
  );
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [showLessonForm, setShowLessonForm] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  const supabase = createClient();

  // Add module
  const handleAddModule = async () => {
    if (!newModuleTitle.trim()) return;

    const { data, error } = await supabase
      .from("modules")
      .insert({
        course_id: courseId,
        title: newModuleTitle.trim(),
        sort_order: modules.length,
        is_preview: false,
        duration_minutes: 0,
      })
      .select()
      .single();

    if (!error && data) {
      setModules([...modules, { ...data, lessons: [] } as Module]);
      setNewModuleTitle("");
    }
  };

  // Delete module
  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm("Delete this module and all its lessons?")) return;

    const { error } = await supabase
      .from("modules")
      .delete()
      .eq("id", moduleId);

    if (!error) {
      setModules(modules.filter((m) => m.id !== moduleId));
    }
  };

  // Rename module
  const handleRenameModule = async (moduleId: string) => {
    if (!editTitle.trim()) return;

    const { error } = await supabase
      .from("modules")
      .update({ title: editTitle.trim() })
      .eq("id", moduleId);

    if (!error) {
      setModules(
        modules.map((m) =>
          m.id === moduleId ? { ...m, title: editTitle.trim() } : m
        )
      );
      setEditingModuleId(null);
    }
  };

  // Move module up/down
  const handleMoveModule = async (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= modules.length) return;

    const updated = [...modules];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];

    // Update sort orders
    const promises = updated.map((m, i) =>
      supabase.from("modules").update({ sort_order: i }).eq("id", m.id)
    );
    await Promise.all(promises);

    setModules(updated);
  };

  // Add/edit lesson callbacks
  const handleLessonSaved = (moduleId: string, lesson: Lesson) => {
    setModules(
      modules.map((m) => {
        if (m.id !== moduleId) return m;
        const lessons = m.lessons ?? [];
        const existingIndex = lessons.findIndex((l) => l.id === lesson.id);
        if (existingIndex >= 0) {
          const updated = [...lessons];
          updated[existingIndex] = lesson;
          return { ...m, lessons: updated };
        }
        return { ...m, lessons: [...lessons, lesson] };
      })
    );
    setShowLessonForm(null);
    setEditingLesson(null);
  };

  const handleDeleteLesson = async (moduleId: string, lessonId: string) => {
    if (!confirm("Delete this lesson?")) return;

    const { error } = await supabase
      .from("lessons")
      .delete()
      .eq("id", lessonId);

    if (!error) {
      setModules(
        modules.map((m) => {
          if (m.id !== moduleId) return m;
          return {
            ...m,
            lessons: (m.lessons ?? []).filter((l) => l.id !== lessonId),
          };
        })
      );
    }
  };

  const contentTypeColors: Record<string, string> = {
    video: "bg-info/10 text-info",
    document: "bg-accent-50 text-accent-600",
    quiz: "bg-warning/10 text-warning",
    assignment: "bg-brand-50 text-brand-600",
  };

  return (
    <div className="space-y-4">
      {modules.map((mod, index) => (
        <Card key={mod.id}>
          <CardHeader className="cursor-pointer py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    disabled={index === 0}
                    onClick={() => handleMoveModule(index, "up")}
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    disabled={index === modules.length - 1}
                    onClick={() => handleMoveModule(index, "down")}
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </div>

                {editingModuleId === mod.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="h-8 w-60"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRenameModule(mod.id);
                        if (e.key === "Escape") setEditingModuleId(null);
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleRenameModule(mod.id)}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => setEditingModuleId(null)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <button
                    className="flex items-center gap-2 text-start"
                    onClick={() =>
                      setExpandedModule(
                        expandedModule === mod.id ? null : mod.id
                      )
                    }
                  >
                    <CardTitle className="text-base">
                      Module {index + 1}: {mod.title}
                    </CardTitle>
                    <Badge variant="secondary" className="text-[10px]">
                      {mod.lessons?.length ?? 0} lessons
                    </Badge>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => {
                    setEditingModuleId(mod.id);
                    setEditTitle(mod.title);
                  }}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-error hover:text-error"
                  onClick={() => handleDeleteModule(mod.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {expandedModule === mod.id && (
            <CardContent className="pt-0">
              {/* Lessons list */}
              <div className="space-y-2">
                {(mod.lessons ?? []).map((lesson, li) => (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {li + 1}
                      </span>
                      <Badge
                        className={cn(
                          "text-[10px]",
                          contentTypeColors[lesson.content_type] ?? ""
                        )}
                      >
                        {lesson.content_type}
                      </Badge>
                      <span className="text-sm font-medium">
                        {lesson.title}
                      </span>
                      {lesson.is_preview && (
                        <Badge variant="outline" className="text-[10px]">
                          Preview
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {lesson.duration_minutes > 0 && (
                        <span className="text-xs text-muted-foreground me-2">
                          {lesson.duration_minutes}min
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => {
                          setEditingLesson(lesson);
                          setShowLessonForm(mod.id);
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-error hover:text-error"
                        onClick={() => handleDeleteLesson(mod.id, lesson.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add lesson */}
              {showLessonForm === mod.id ? (
                <div className="mt-3">
                  <LessonForm
                    courseId={courseId}
                    moduleId={mod.id}
                    sortOrder={(mod.lessons?.length ?? 0)}
                    initialData={editingLesson}
                    onSave={(lesson) => handleLessonSaved(mod.id, lesson)}
                    onCancel={() => {
                      setShowLessonForm(null);
                      setEditingLesson(null);
                    }}
                  />
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    setEditingLesson(null);
                    setShowLessonForm(mod.id);
                  }}
                >
                  <Plus className="h-3 w-3 me-1" />
                  Add Lesson
                </Button>
              )}
            </CardContent>
          )}
        </Card>
      ))}

      {/* Add new module */}
      <div className="flex items-center gap-2">
        <Input
          value={newModuleTitle}
          onChange={(e) => setNewModuleTitle(e.target.value)}
          placeholder="New module title..."
          className="max-w-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAddModule();
          }}
        />
        <Button onClick={handleAddModule} disabled={!newModuleTitle.trim()}>
          <Plus className="h-4 w-4 me-1" />
          Add Module
        </Button>
      </div>
    </div>
  );
}
