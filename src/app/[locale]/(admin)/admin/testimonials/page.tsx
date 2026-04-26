"use client";

import { useEffect, useState } from "react";
import {
  MessageSquareQuote,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

interface TestimonialRow {
  id: string;
  name: string;
  name_ar: string | null;
  role: string;
  role_ar: string | null;
  company: string | null;
  company_ar: string | null;
  quote: string;
  quote_ar: string | null;
  avatar_url: string | null;
  designation: string | null;
  rating: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

const EMPTY_FORM = {
  name: "",
  name_ar: "",
  role: "",
  role_ar: "",
  company: "",
  company_ar: "",
  quote: "",
  quote_ar: "",
  avatar_url: "",
  designation: "",
  rating: 5,
  sort_order: 0,
  is_active: true,
};

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<TestimonialRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const fetchTestimonials = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("testimonials")
      .select("*")
      .order("sort_order");

    setTestimonials((data ?? []) as TestimonialRow[]);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    const supabase = createClient();

    const payload = {
      name: formData.name,
      name_ar: formData.name_ar || null,
      role: formData.role,
      role_ar: formData.role_ar || null,
      company: formData.company || null,
      company_ar: formData.company_ar || null,
      quote: formData.quote,
      quote_ar: formData.quote_ar || null,
      avatar_url: formData.avatar_url || null,
      designation: formData.designation || null,
      rating: formData.rating,
      sort_order: formData.sort_order,
      is_active: formData.is_active,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase
        .from("testimonials")
        .update(payload)
        .eq("id", editingId));
    } else {
      ({ error } = await supabase.from("testimonials").insert(payload));
    }

    if (error) {
      setSaveError(error.message);
      setIsSaving(false);
      return;
    }

    setShowForm(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setIsSaving(false);
    fetchTestimonials();
  };

  const handleEdit = (item: TestimonialRow) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      name_ar: item.name_ar ?? "",
      role: item.role,
      role_ar: item.role_ar ?? "",
      company: item.company ?? "",
      company_ar: item.company_ar ?? "",
      quote: item.quote,
      quote_ar: item.quote_ar ?? "",
      avatar_url: item.avatar_url ?? "",
      designation: item.designation ?? "",
      rating: item.rating,
      sort_order: item.sort_order,
      is_active: item.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this testimonial?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("testimonials").delete().eq("id", id);
    if (error) {
      toast.error(`Could not delete: ${error.message}`);
      return;
    }
    toast.success("Testimonial deleted");
    fetchTestimonials();
  };

  const handleToggleActive = async (item: TestimonialRow) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("testimonials")
      .update({ is_active: !item.is_active })
      .eq("id", item.id);
    if (error) {
      toast.error(`Could not update: ${error.message}`);
      return;
    }
    fetchTestimonials();
  };

  const columns: Column<TestimonialRow>[] = [
    {
      key: "author",
      header: "Author",
      render: (item) => (
        <div className="flex items-center gap-3">
          {item.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.avatar_url}
              alt={item.name}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
              {item.name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
          )}
          <div>
            <span className="font-medium">{item.name}</span>
            {item.name_ar && (
              <p className="text-xs text-muted-foreground" dir="rtl">
                {item.name_ar}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role / Company",
      render: (item) => (
        <div>
          <span className="text-sm">{item.role}</span>
          {item.company && (
            <p className="text-xs text-muted-foreground">{item.company}</p>
          )}
        </div>
      ),
    },
    {
      key: "quote",
      header: "Quote",
      render: (item) => (
        <span className="text-xs text-muted-foreground line-clamp-2 max-w-[200px]">
          {item.quote.length > 80
            ? item.quote.slice(0, 80) + "..."
            : item.quote}
        </span>
      ),
    },
    {
      key: "designation",
      header: "Designation",
      render: (item) =>
        item.designation ? (
          <Badge variant="secondary" className="text-xs">
            {item.designation}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      key: "rating",
      header: "Rating",
      render: (item) => (
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              className={`h-3 w-3 ${
                i < item.rating
                  ? "fill-amber-400 text-amber-400"
                  : "fill-muted text-muted"
              }`}
            />
          ))}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item) => (
        <button onClick={() => handleToggleActive(item)}>
          <Badge variant={item.is_active ? "default" : "secondary"}>
            {item.is_active ? "Active" : "Inactive"}
          </Badge>
        </button>
      ),
    },
    {
      key: "order",
      header: "Order",
      render: (item) => (
        <span className="text-sm text-muted-foreground">{item.sort_order}</span>
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
        <h1 className="font-heading text-2xl font-bold">Testimonials</h1>
        <Button
          size="sm"
          onClick={() => {
            setEditingId(null);
            setFormData(EMPTY_FORM);
            setShowForm(true);
          }}
        >
          <Plus className="h-4 w-4 me-1" />
          Add Testimonial
        </Button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {editingId ? "Edit Testimonial" : "New Testimonial"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Name EN */}
              <div className="space-y-2">
                <Label>Name (EN) *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g. Ahmed Al-Rashid"
                />
              </div>
              {/* Name AR */}
              <div className="space-y-2">
                <Label>Name (AR)</Label>
                <Input
                  value={formData.name_ar}
                  onChange={(e) =>
                    setFormData({ ...formData, name_ar: e.target.value })
                  }
                  dir="rtl"
                  placeholder="مثال: أحمد الراشد"
                />
              </div>
              {/* Role EN */}
              <div className="space-y-2">
                <Label>Role (EN) *</Label>
                <Input
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  placeholder="e.g. Financial Analyst"
                />
              </div>
              {/* Role AR */}
              <div className="space-y-2">
                <Label>Role (AR)</Label>
                <Input
                  value={formData.role_ar}
                  onChange={(e) =>
                    setFormData({ ...formData, role_ar: e.target.value })
                  }
                  dir="rtl"
                  placeholder="مثال: محلل مالي"
                />
              </div>
              {/* Company EN */}
              <div className="space-y-2">
                <Label>Company (EN)</Label>
                <Input
                  value={formData.company}
                  onChange={(e) =>
                    setFormData({ ...formData, company: e.target.value })
                  }
                  placeholder="e.g. KPMG"
                />
              </div>
              {/* Company AR */}
              <div className="space-y-2">
                <Label>Company (AR)</Label>
                <Input
                  value={formData.company_ar}
                  onChange={(e) =>
                    setFormData({ ...formData, company_ar: e.target.value })
                  }
                  dir="rtl"
                  placeholder="مثال: كي بي إم جي"
                />
              </div>
              {/* Quote EN */}
              <div className="space-y-2 sm:col-span-2">
                <Label>Quote (EN) *</Label>
                <Textarea
                  value={formData.quote}
                  onChange={(e) =>
                    setFormData({ ...formData, quote: e.target.value })
                  }
                  placeholder="The learner's testimonial in English..."
                  rows={3}
                />
              </div>
              {/* Quote AR */}
              <div className="space-y-2 sm:col-span-2">
                <Label>Quote (AR)</Label>
                <Textarea
                  value={formData.quote_ar}
                  onChange={(e) =>
                    setFormData({ ...formData, quote_ar: e.target.value })
                  }
                  dir="rtl"
                  placeholder="شهادة المتعلم بالعربية..."
                  rows={3}
                />
              </div>
              {/* Avatar URL */}
              <div className="space-y-2">
                <Label>Avatar URL</Label>
                <Input
                  value={formData.avatar_url}
                  onChange={(e) =>
                    setFormData({ ...formData, avatar_url: e.target.value })
                  }
                  placeholder="https://example.com/photo.jpg"
                />
              </div>
              {/* Designation */}
              <div className="space-y-2">
                <Label>Designation</Label>
                <Input
                  value={formData.designation}
                  onChange={(e) =>
                    setFormData({ ...formData, designation: e.target.value })
                  }
                  placeholder="e.g. CDA, CDIP"
                />
              </div>
              {/* Rating */}
              <div className="space-y-2">
                <Label>Rating (1-5)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={formData.rating}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rating: Math.min(5, Math.max(1, parseInt(e.target.value) || 5)),
                      })
                    }
                    className="w-20"
                  />
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 cursor-pointer ${
                          i < formData.rating
                            ? "fill-amber-400 text-amber-400"
                            : "fill-muted text-muted"
                        }`}
                        onClick={() =>
                          setFormData({ ...formData, rating: i + 1 })
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>
              {/* Sort Order */}
              <div className="space-y-2">
                <Label>Sort Order</Label>
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
              {/* Active Toggle */}
              <div className="flex items-center gap-3 sm:col-span-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="is_active">Active (visible on landing page)</Label>
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
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || !formData.name || !formData.role || !formData.quote}
              >
                {isSaving && (
                  <Loader2 className="h-4 w-4 animate-spin me-2" />
                )}
                {editingId ? "Update" : "Create"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquareQuote className="h-5 w-5" />
            Testimonials ({testimonials.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={testimonials}
            rowKey={(item) => item.id}
            emptyMessage="No testimonials yet. Click 'Add Testimonial' to create one."
          />
        </CardContent>
      </Card>
    </div>
  );
}
