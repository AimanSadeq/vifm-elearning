"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Trophy, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
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

interface BadgeRow {
  id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  icon_url: string | null;
  criteria: string | null;
  is_active: boolean;
  created_at: string;
}

export default function AdminBadgesPage() {
  const t = useTranslations("admin");

  const [badges, setBadges] = useState<BadgeRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    name_ar: "",
    description: "",
    description_ar: "",
    icon_url: "",
    criteria: "",
  });

  const fetchBadges = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("badges")
      .select("*")
      .order("created_at", { ascending: false });

    setBadges((data as BadgeRow[]) ?? []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchBadges();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    const supabase = createClient();

    const payload = {
      name: formData.name,
      name_ar: formData.name_ar || null,
      description: formData.description || null,
      description_ar: formData.description_ar || null,
      icon_url: formData.icon_url || null,
      criteria: formData.criteria || null,
    };

    const { error } = editingId
      ? await supabase.from("badges").update(payload).eq("id", editingId)
      : await supabase.from("badges").insert(payload);

    setIsSaving(false);

    if (error) {
      toast.error(`Could not save badge: ${error.message}`);
      return;
    }

    toast.success(editingId ? "Badge updated" : "Badge created");
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: "",
      name_ar: "",
      description: "",
      description_ar: "",
      icon_url: "",
      criteria: "",
    });
    fetchBadges();
  };

  const handleEdit = (badge: BadgeRow) => {
    setEditingId(badge.id);
    setFormData({
      name: badge.name,
      name_ar: badge.name_ar ?? "",
      description: badge.description ?? "",
      description_ar: badge.description_ar ?? "",
      icon_url: badge.icon_url ?? "",
      criteria: badge.criteria ?? "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this badge?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("badges").delete().eq("id", id);
    if (error) {
      toast.error(`Could not delete: ${error.message}`);
      return;
    }
    toast.success("Badge deleted");
    fetchBadges();
  };

  const columns: Column<BadgeRow>[] = [
    {
      key: "icon",
      header: "",
      render: (item) =>
        item.icon_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.icon_url}
            alt={item.name}
            className="h-8 w-8 rounded"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded bg-warning/10">
            <Trophy className="h-4 w-4 text-warning" />
          </div>
        ),
      className: "w-12",
    },
    {
      key: "name",
      header: "Badge",
      render: (item) => (
        <div>
          <span className="font-medium">{item.name}</span>
          {item.name_ar && (
            <p className="text-xs text-muted-foreground" dir="rtl">
              {item.name_ar}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "description",
      header: "Description",
      render: (item) => (
        <span className="text-xs text-muted-foreground line-clamp-2">
          {item.description || "—"}
        </span>
      ),
    },
    {
      key: "criteria",
      header: "Criteria",
      render: (item) => (
        <span className="text-xs text-muted-foreground">
          {item.criteria || "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item) => (
        <Badge variant={item.is_active ? "success" : "secondary"}>
          {item.is_active ? "Active" : "Inactive"}
        </Badge>
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
        <h1 className="font-heading text-2xl font-bold">{t("badges")}</h1>
        <Button
          size="sm"
          onClick={() => {
            setEditingId(null);
            setFormData({
              name: "",
              name_ar: "",
              description: "",
              description_ar: "",
              icon_url: "",
              criteria: "",
            });
            setShowForm(true);
          }}
        >
          <Plus className="h-4 w-4 me-1" />
          Add Badge
        </Button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {editingId ? "Edit Badge" : "New Badge"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Name (EN) *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Name (AR)</Label>
                <Input
                  value={formData.name_ar}
                  onChange={(e) =>
                    setFormData({ ...formData, name_ar: e.target.value })
                  }
                  dir="rtl"
                />
              </div>
              <div className="space-y-2">
                <Label>Description (EN)</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Description (AR)</Label>
                <Textarea
                  value={formData.description_ar}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description_ar: e.target.value,
                    })
                  }
                  rows={2}
                  dir="rtl"
                />
              </div>
              <div className="space-y-2">
                <Label>Icon URL</Label>
                <Input
                  value={formData.icon_url}
                  onChange={(e) =>
                    setFormData({ ...formData, icon_url: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Criteria</Label>
                <Input
                  value={formData.criteria}
                  onChange={(e) =>
                    setFormData({ ...formData, criteria: e.target.value })
                  }
                  placeholder="e.g. Complete 5 courses"
                />
              </div>
            </div>
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
                disabled={isSaving || !formData.name}
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
            <Trophy className="h-5 w-5" />
            Badges ({badges.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={badges}
            rowKey={(item) => item.id}
            emptyMessage="No badges yet"
          />
        </CardContent>
      </Card>
    </div>
  );
}
