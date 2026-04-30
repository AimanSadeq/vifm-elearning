"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Pencil, Palette, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { CertificateTemplateForm } from "@/components/admin/CertificateTemplateForm";
import type { CertificateTemplateInput } from "@/lib/utils/validators";
import type { CertificateTemplate, CertificateTemplateKey } from "@/types";

export default function AdminCertificateTemplatesPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) ?? "en";
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<CertificateTemplate | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    setIsLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("certificate_templates")
      .select("*")
      .order("created_at", { ascending: false });

    setTemplates((data as CertificateTemplate[]) ?? []);
    setIsLoading(false);
  }

  async function handleSave(data: CertificateTemplateInput) {
    setIsSaving(true);
    const supabase = createClient();

    // Refuse to un-mark the only existing default. Without this guard an admin
    // can leave the system with no default template, which then breaks
    // certificate generation for every course that doesn't pin a template.
    if (
      editingTemplate?.is_default &&
      !data.isDefault
    ) {
      const { count } = await supabase
        .from("certificate_templates")
        .select("id", { count: "exact", head: true })
        .eq("is_default", true);
      if ((count ?? 0) <= 1) {
        setIsSaving(false);
        toast.error(
          "Cannot remove default — set another template as default first."
        );
        return;
      }
    }

    const dbData = {
      name: data.name,
      name_ar: data.nameAr || null,
      template_key: data.templateKey,
      primary_color: data.primaryColor,
      secondary_color: data.secondaryColor,
      accent_color: data.accentColor,
      logo_url: data.logoUrl || null,
      organization_name: data.organizationName,
      organization_name_ar: data.organizationNameAr || null,
      is_default: data.isDefault,
      is_active: data.isActive,
    };

    // Save the template first. Only after the save succeeds do we touch the
    // other rows' is_default flag — otherwise a save failure could leave the
    // system with no default template at all.
    let savedId = editingTemplate?.id;
    if (editingTemplate) {
      const { error } = await supabase
        .from("certificate_templates")
        .update(dbData)
        .eq("id", editingTemplate.id);
      if (error) {
        setIsSaving(false);
        toast.error(`Could not update template: ${error.message}`);
        return;
      }
    } else {
      const { data: inserted, error } = await supabase
        .from("certificate_templates")
        .insert(dbData)
        .select("id")
        .single();
      if (error) {
        setIsSaving(false);
        toast.error(`Could not create template: ${error.message}`);
        return;
      }
      savedId = inserted?.id;
    }

    if (data.isDefault && savedId) {
      const { error } = await supabase
        .from("certificate_templates")
        .update({ is_default: false })
        .neq("id", savedId);
      if (error) {
        toast.error(
          `Template saved, but could not clear other defaults: ${error.message}`
        );
      }
    }

    toast.success(editingTemplate ? "Template updated" : "Template created");
    setShowForm(false);
    setEditingTemplate(null);
    setIsSaving(false);
    await fetchTemplates();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this certificate template?")) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("certificate_templates")
      .delete()
      .eq("id", id);
    if (error) {
      toast.error(`Could not delete: ${error.message}`);
      return;
    }
    toast.success("Template deleted");
    await fetchTemplates();
  }

  async function handleToggleActive(template: CertificateTemplate) {
    const supabase = createClient();
    const { error } = await supabase
      .from("certificate_templates")
      .update({ is_active: !template.is_active })
      .eq("id", template.id);
    if (error) {
      toast.error(`Could not update: ${error.message}`);
      return;
    }
    await fetchTemplates();
  }

  function getStyleBadge(key: CertificateTemplateKey) {
    switch (key) {
      case "classic":
        return <Badge variant="secondary">Classic</Badge>;
      case "modern":
        return <Badge variant="info">Modern</Badge>;
      case "corporate":
        return <Badge variant="warning">Corporate</Badge>;
      case "elegant":
        return <Badge variant="success">Elegant</Badge>;
    }
  }

  const columns: Column<CertificateTemplate>[] = [
    {
      key: "name",
      header: "Name",
      render: (item) => <span className="font-semibold">{item.name}</span>,
    },
    {
      key: "template_key",
      header: "Style",
      render: (item) => getStyleBadge(item.template_key),
    },
    {
      key: "colors",
      header: "Colors",
      render: (item) => (
        <div className="flex items-center gap-1">
          <div
            className="h-5 w-5 rounded border"
            style={{ backgroundColor: item.primary_color }}
            title={`Primary: ${item.primary_color}`}
          />
          <div
            className="h-5 w-5 rounded border"
            style={{ backgroundColor: item.secondary_color }}
            title={`Secondary: ${item.secondary_color}`}
          />
          <div
            className="h-5 w-5 rounded border"
            style={{ backgroundColor: item.accent_color }}
            title={`Accent: ${item.accent_color}`}
          />
        </div>
      ),
    },
    {
      key: "organization",
      header: "Organization",
      render: (item) => (
        <span className="max-w-[200px] truncate text-sm">
          {item.organization_name}
        </span>
      ),
    },
    {
      key: "default",
      header: "Default",
      render: (item) =>
        item.is_default ? (
          <Badge variant="success">Default</Badge>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (item) =>
        item.is_active ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="secondary">Inactive</Badge>
        ),
    },
    {
      key: "actions",
      header: "",
      className: "w-32",
      render: (item) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => {
              setEditingTemplate(item);
              setShowForm(true);
            }}
            title="Edit template details"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() =>
              router.push(
                `/${locale}/admin/certificates/templates/${item.id}/edit`
              )
            }
            title="Open layout editor"
          >
            <Palette className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => handleToggleActive(item)}
          >
            {item.is_active ? "Disable" : "Enable"}
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
        <h1 className="font-heading text-2xl font-bold">
          Certificate Templates
        </h1>
        <Button
          onClick={() => {
            setEditingTemplate(null);
            setShowForm(!showForm);
          }}
        >
          <Plus className="h-4 w-4 me-2" />
          Create Template
        </Button>
      </div>

      {showForm && (
        <CertificateTemplateForm
          initialData={
            editingTemplate
              ? {
                  id: editingTemplate.id,
                  name: editingTemplate.name,
                  nameAr: editingTemplate.name_ar ?? undefined,
                  templateKey: editingTemplate.template_key,
                  primaryColor: editingTemplate.primary_color,
                  secondaryColor: editingTemplate.secondary_color,
                  accentColor: editingTemplate.accent_color,
                  logoUrl: editingTemplate.logo_url ?? undefined,
                  organizationName: editingTemplate.organization_name,
                  organizationNameAr:
                    editingTemplate.organization_name_ar ?? undefined,
                  isDefault: editingTemplate.is_default,
                  isActive: editingTemplate.is_active,
                }
              : undefined
          }
          onSubmit={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingTemplate(null);
          }}
          isLoading={isSaving}
        />
      )}

      <Card>
        <CardHeader />
        <CardContent>
          <DataTable
            columns={columns}
            data={templates}
            isLoading={isLoading}
            rowKey={(item) => item.id}
            emptyMessage="No certificate templates yet. Create one to get started."
          />
        </CardContent>
      </Card>
    </div>
  );
}
