"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { FolderOpen, Plus, Pencil, Trash2, Loader2, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { reportSupabaseError } from "@/lib/utils/supabase-error";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

interface CategoryRow {
  id: string;
  name: string;
  name_ar: string;
  description: string | null;
  description_ar: string | null;
  slug: string;
  icon: string | null;
  color: string | null;
  sort_order: number;
  is_active: boolean;
  course_count: number;
}

// Auto-generate icon & color from category name
const CATEGORY_MAPPINGS: { keywords: string[]; icon: string; color: string }[] = [
  { keywords: ["finance", "financial", "banking", "bank"], icon: "🏦", color: "#1E3A5F" },
  { keywords: ["accounting", "audit", "bookkeeping"], icon: "📒", color: "#2E5E4E" },
  { keywords: ["investment", "investing", "portfolio", "stock", "equity"], icon: "📈", color: "#1B5E20" },
  { keywords: ["data", "analytics", "analysis", "statistics"], icon: "📊", color: "#2D6A4F" },
  { keywords: ["ai", "artificial intelligence", "machine learning", "ml", "deep learning"], icon: "🤖", color: "#4A148C" },
  { keywords: ["technology", "tech", "software", "programming", "coding", "developer"], icon: "💻", color: "#0D47A1" },
  { keywords: ["strategy", "strategic", "planning"], icon: "🎯", color: "#7B2D8B" },
  { keywords: ["leadership", "management", "manager", "executive"], icon: "👔", color: "#37474F" },
  { keywords: ["compliance", "regulation", "regulatory", "governance"], icon: "🛡️", color: "#B85C38" },
  { keywords: ["risk", "risk management"], icon: "⚠️", color: "#E65100" },
  { keywords: ["marketing", "digital marketing", "advertising", "brand"], icon: "📣", color: "#AD1457" },
  { keywords: ["sales", "selling", "revenue"], icon: "💰", color: "#F57F17" },
  { keywords: ["human resources", "hr", "recruitment", "talent"], icon: "👥", color: "#00695C" },
  { keywords: ["project", "project management", "agile", "scrum"], icon: "📋", color: "#4527A0" },
  { keywords: ["economics", "economy", "macro", "micro"], icon: "🌐", color: "#1565C0" },
  { keywords: ["insurance", "actuarial"], icon: "🔒", color: "#5D4037" },
  { keywords: ["real estate", "property"], icon: "🏠", color: "#795548" },
  { keywords: ["entrepreneurship", "startup", "business"], icon: "🚀", color: "#C62828" },
  { keywords: ["communication", "writing", "presentation"], icon: "🎤", color: "#00838F" },
  { keywords: ["law", "legal", "contract"], icon: "⚖️", color: "#3E2723" },
  { keywords: ["health", "healthcare", "medical", "wellness"], icon: "🏥", color: "#2E7D32" },
  { keywords: ["education", "teaching", "training", "learning"], icon: "📚", color: "#1976D2" },
  { keywords: ["design", "creative", "ux", "ui"], icon: "🎨", color: "#E91E63" },
  { keywords: ["operations", "supply chain", "logistics"], icon: "⚙️", color: "#455A64" },
  { keywords: ["sustainability", "esg", "environment", "green"], icon: "🌱", color: "#388E3C" },
  { keywords: ["blockchain", "crypto", "defi", "web3"], icon: "🔗", color: "#6A1B9A" },
  { keywords: ["cybersecurity", "security", "cyber"], icon: "🔐", color: "#B71C1C" },
  { keywords: ["cloud", "devops", "infrastructure"], icon: "☁️", color: "#0277BD" },
  { keywords: ["ethics", "corporate governance"], icon: "📜", color: "#4E342E" },
  { keywords: ["tax", "taxation"], icon: "🧾", color: "#546E7A" },
];

// Fallback colors for categories that don't match any keywords
const FALLBACK_COLORS = [
  "#1E88E5", "#43A047", "#E53935", "#8E24AA", "#FB8C00",
  "#00ACC1", "#3949AB", "#7CB342", "#F4511E", "#6D4C41",
];

function autoGenerateIconAndColor(name: string): { icon: string; color: string } {
  const lower = name.toLowerCase();

  for (const mapping of CATEGORY_MAPPINGS) {
    for (const keyword of mapping.keywords) {
      if (lower.includes(keyword)) {
        return { icon: mapping.icon, color: mapping.color };
      }
    }
  }

  // Fallback: generate a consistent color from the name hash, with a generic icon
  let hash = 0;
  for (let i = 0; i < lower.length; i++) {
    hash = lower.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % FALLBACK_COLORS.length;

  return { icon: "📂", color: FALLBACK_COLORS[colorIndex] };
}

export default function AdminCategoriesPage() {
  const t = useTranslations("admin");

  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    name_ar: "",
    description: "",
    description_ar: "",
    slug: "",
    icon: "",
    color: "",
    sort_order: 0,
  });
  const [autoGenerated, setAutoGenerated] = useState(false);

  const handleNameChange = useCallback((name: string) => {
    const generated = autoGenerateIconAndColor(name);
    setFormData((prev) => ({
      ...prev,
      name,
      icon: generated.icon,
      color: generated.color,
    }));
    setAutoGenerated(true);
  }, []);

  const fetchCategories = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*, courses(count)")
      .order("sort_order");

    if (error) {
      reportSupabaseError(error, "Could not load categories");
      setCategories([]);
      setIsLoading(false);
      return;
    }

    const mapped: CategoryRow[] = (data ?? []).map(
      (c: Record<string, unknown>) => ({
        id: c.id as string,
        name: c.name as string,
        name_ar: c.name_ar as string,
        description: (c.description as string | null) ?? null,
        description_ar: (c.description_ar as string | null) ?? null,
        slug: c.slug as string,
        icon: c.icon as string | null,
        color: c.color as string | null,
        sort_order: c.sort_order as number,
        is_active: c.is_active as boolean,
        course_count:
          ((c.courses as Array<{ count: number }>)?.[0]?.count as number) ?? 0,
      })
    );

    setCategories(mapped);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    const supabase = createClient();

    const payload = {
      name: formData.name,
      name_ar: formData.name_ar,
      description: formData.description.trim() || null,
      description_ar: formData.description_ar.trim() || null,
      slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, "-"),
      icon: formData.icon || null,
      color: formData.color || null,
      sort_order: formData.sort_order,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from("categories").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("categories").insert(payload));
    }

    if (error) {
      setSaveError(error.message);
      setIsSaving(false);
      return;
    }

    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: "",
      name_ar: "",
      description: "",
      description_ar: "",
      slug: "",
      icon: "",
      color: "",
      sort_order: 0,
    });
    setAutoGenerated(false);
    setIsSaving(false);
    fetchCategories();
  };

  const handleEdit = (cat: CategoryRow) => {
    setEditingId(cat.id);
    setFormData({
      name: cat.name,
      name_ar: cat.name_ar,
      description: cat.description ?? "",
      description_ar: cat.description_ar ?? "",
      slug: cat.slug,
      icon: cat.icon ?? "",
      color: cat.color ?? "",
      sort_order: cat.sort_order,
    });
    setAutoGenerated(false);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    const supabase = createClient();
    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
      alert("Failed to delete category: " + error.message);
      return;
    }

    fetchCategories();
  };

  const columns: Column<CategoryRow>[] = [
    {
      key: "name",
      header: "Name",
      render: (item) => (
        <div>
          <span className="font-medium">{item.name}</span>
          <p className="text-xs text-muted-foreground">{item.name_ar}</p>
        </div>
      ),
    },
    {
      key: "slug",
      header: "Slug",
      render: (item) => (
        <span className="text-xs text-muted-foreground">{item.slug}</span>
      ),
    },
    {
      key: "preview",
      header: "Preview",
      render: (item) => (
        <div className="flex items-center gap-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full text-lg"
            style={{ backgroundColor: `${item.color || "#666"}20` }}
          >
            {item.icon || "📂"}
          </div>
          {item.color && (
            <div
              className="h-4 w-4 rounded-full border"
              style={{ backgroundColor: item.color }}
            />
          )}
        </div>
      ),
    },
    {
      key: "sort",
      header: "Order",
      render: (item) => <span>{item.sort_order}</span>,
    },
    {
      key: "courses",
      header: "Courses",
      render: (item) => (
        <Badge variant="secondary">{item.course_count}</Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (item) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(item.id)}
          >
            <Trash2 className="h-4 w-4 text-error" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">
          {t("manageCategories")}
        </h1>
        <Button
          size="sm"
          onClick={() => {
            setEditingId(null);
            setFormData({
              name: "",
              name_ar: "",
              slug: "",
              icon: "",
              color: "",
              sort_order: 0,
            });
            setAutoGenerated(false);
            setShowForm(true);
          }}
        >
          <Plus className="h-4 w-4 me-1" />
          {t("addCategory")}
        </Button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {editingId ? t("editCategory") : t("newCategory")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Preview */}
            {formData.name && (
              <div className="mb-6 flex items-center gap-4 rounded-lg border bg-muted/30 p-4">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-2xl"
                  style={{ backgroundColor: `${formData.color || "#000000"}20` }}
                >
                  {formData.icon || "📂"}
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">{formData.name}</p>
                  {formData.name_ar && (
                    <p className="text-sm text-muted-foreground truncate" dir="rtl">
                      {formData.name_ar}
                    </p>
                  )}
                </div>
                {autoGenerated && (
                  <span className="ms-auto flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    <Sparkles className="h-3 w-3" />
                    Auto
                  </span>
                )}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>{t("nameEn")} *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Finance & Banking"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("nameAr")} *</Label>
                <Input
                  value={formData.name_ar}
                  onChange={(e) =>
                    setFormData({ ...formData, name_ar: e.target.value })
                  }
                  dir="rtl"
                  placeholder="مثال: المالية والمصرفية"
                />
              </div>
              <div className="space-y-2 sm:col-span-2 lg:col-span-3">
                <Label>{t("descriptionEn")}</Label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={2}
                  maxLength={200}
                  placeholder="Short description shown on the home page (max 200 chars)"
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="space-y-2 sm:col-span-2 lg:col-span-3">
                <Label>{t("descriptionAr")}</Label>
                <textarea
                  value={formData.description_ar}
                  onChange={(e) =>
                    setFormData({ ...formData, description_ar: e.target.value })
                  }
                  dir="rtl"
                  rows={2}
                  maxLength={200}
                  placeholder="وصف قصير يظهر في الصفحة الرئيسية (٢٠٠ حرف كحد أقصى)"
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("slug")}</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  placeholder="auto-generated"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("icon")}</Label>
                <div className="flex gap-2">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-muted/50 text-lg"
                  >
                    {formData.icon || "—"}
                  </div>
                  <Input
                    value={formData.icon}
                    onChange={(e) => {
                      setFormData({ ...formData, icon: e.target.value });
                      setAutoGenerated(false);
                    }}
                    placeholder="e.g. 📊"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("color")}</Label>
                <div className="flex gap-2">
                  <div
                    className="h-10 w-10 shrink-0 rounded-md border"
                    style={{ backgroundColor: formData.color || "#000000" }}
                  />
                  <Input
                    type="color"
                    value={formData.color || "#000000"}
                    onChange={(e) => {
                      setFormData({ ...formData, color: e.target.value });
                      setAutoGenerated(false);
                    }}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("sortOrder")}</Label>
                <Input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sort_order: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            {saveError && (
              <div className="mt-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {saveError}
              </div>
            )}
            <div className="mt-4 flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
              >
                {t("cancel")}
              </Button>
              <Button onClick={handleSave} disabled={isSaving || !formData.name}>
                {isSaving && (
                  <Loader2 className="h-4 w-4 animate-spin me-2" />
                )}
                {editingId ? t("update") : t("create")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Categories ({categories.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={categories}
            rowKey={(item) => item.id}
            emptyMessage="No categories yet"
          />
        </CardContent>
      </Card>
    </div>
  );
}
