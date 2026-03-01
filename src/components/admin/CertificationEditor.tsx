"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Save,
  Loader2,
  Pencil,
  X,
  Plus,
  Trash2,
  Download,
  Users,
  FileText,
  Layers,
  Clock,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import type {
  Designation,
  DesignationTier,
  CPECategory,
  DesignationDocument,
} from "@/types";

const inputClass =
  "mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface CertificationEditorProps {
  designation: Designation;
  initialTiers: DesignationTier[];
  initialCpeCategories: CPECategory[];
  initialDocuments: DesignationDocument[];
  holderCount: number;
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------
type TabId = "details" | "tiers" | "cpe" | "documents" | "holders";

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "details", label: "Details", icon: Settings2 },
  { id: "tiers", label: "Tiers", icon: Layers },
  { id: "cpe", label: "CPE Categories", icon: Clock },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "holders", label: "Holders", icon: Users },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function CertificationEditor({
  designation,
  initialTiers,
  initialCpeCategories,
  initialDocuments,
  holderCount,
}: CertificationEditorProps) {
  const [activeTab, setActiveTab] = useState<TabId>("details");

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-muted/30 p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                activeTab === tab.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {tab.id === "holders" && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {holderCount}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "details" && <DetailsTab designation={designation} />}
      {activeTab === "tiers" && (
        <TiersTab designationId={designation.id} initialTiers={initialTiers} />
      )}
      {activeTab === "cpe" && (
        <CPETab
          designationId={designation.id}
          initialCategories={initialCpeCategories}
        />
      )}
      {activeTab === "documents" && (
        <DocumentsTab
          designationId={designation.id}
          initialDocuments={initialDocuments}
        />
      )}
      {activeTab === "holders" && (
        <HoldersTab designationId={designation.id} holderCount={holderCount} />
      )}
    </div>
  );
}

// ===========================================================================
// DETAILS TAB
// ===========================================================================
function DetailsTab({ designation }: { designation: Designation }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const meta = designation.metadata ?? {};

  const [form, setForm] = useState({
    name: designation.name,
    name_ar: designation.name_ar ?? "",
    abbreviation: designation.abbreviation,
    slug: designation.slug,
    description: designation.description ?? "",
    description_ar: designation.description_ar ?? "",
    founding_fee: String(designation.founding_fee),
    renewal_fee: String(designation.renewal_fee),
    late_fee: String(designation.late_fee),
    reinstatement_fee: String(designation.reinstatement_fee),
    currency: designation.currency,
    annual_cpe_required: String(designation.annual_cpe_required),
    renewal_month: String(designation.renewal_month),
    renewal_day: String(designation.renewal_day),
    grace_period_months: String(designation.grace_period_months),
    is_active: designation.is_active,
    tier_level: (meta.tier_level as string) ?? "gateway",
    exam_type: (meta.exam_type as string) ?? "multiple_choice",
    pass_rate: String(meta.pass_rate ?? 65),
    free_attempts: String(meta.free_attempts ?? 2),
    cpe_cycle_years: String(meta.cpe_cycle_years ?? 2),
    cpe_cycle_hours: String(meta.cpe_cycle_hours ?? 40),
    prerequisites: (meta.prerequisites ?? []).join(", "),
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const supabase = createClient();
      const prereqs = form.prerequisites
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);

      const { error } = await supabase
        .from("designations")
        .update({
          name: form.name.trim(),
          name_ar: form.name_ar.trim() || null,
          abbreviation: form.abbreviation.trim(),
          slug: form.slug.trim(),
          description: form.description.trim() || null,
          description_ar: form.description_ar.trim() || null,
          founding_fee: parseFloat(form.founding_fee) || 0,
          renewal_fee: parseFloat(form.renewal_fee) || 0,
          late_fee: parseFloat(form.late_fee) || 0,
          reinstatement_fee: parseFloat(form.reinstatement_fee) || 0,
          currency: form.currency,
          annual_cpe_required: parseInt(form.annual_cpe_required) || 0,
          renewal_month: parseInt(form.renewal_month) || 7,
          renewal_day: parseInt(form.renewal_day) || 1,
          grace_period_months: parseInt(form.grace_period_months) || 3,
          is_active: form.is_active,
          metadata: {
            tier_level: form.tier_level,
            exam_type: form.exam_type,
            pass_rate: parseInt(form.pass_rate) || 65,
            free_attempts: parseInt(form.free_attempts) || 2,
            cpe_cycle_years: parseInt(form.cpe_cycle_years) || 2,
            cpe_cycle_hours: parseInt(form.cpe_cycle_hours) || 40,
            prerequisites: prereqs,
          },
        })
        .eq("id", designation.id);

      if (error) throw error;
      toast.success("Certification updated");
      setIsEditing(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  // Read-only view
  if (!isEditing) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Certification Details</h2>
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4 me-2" /> Edit
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 text-sm">
            <Field label="Name (EN)" value={form.name} />
            <Field label="Name (AR)" value={form.name_ar} />
            <Field label="Abbreviation" value={form.abbreviation} />
            <Field label="Slug" value={form.slug} />
            <Field label="Tier Level" value={form.tier_level} />
            <Field label="Status" value={form.is_active ? "Active" : "Inactive"} />
            <Field label="Founding Fee" value={`${form.founding_fee} ${form.currency}`} />
            <Field label="Renewal Fee" value={`${form.renewal_fee} ${form.currency}`} />
            <Field label="Late Fee" value={`${form.late_fee} ${form.currency}`} />
            <Field label="Reinstatement Fee" value={`${form.reinstatement_fee} ${form.currency}`} />
            <Field label="Annual CPE Hours" value={form.annual_cpe_required} />
            <Field label="CPE Cycle" value={`${form.cpe_cycle_hours} hrs / ${form.cpe_cycle_years} yrs`} />
            <Field label="Renewal Date" value={`${form.renewal_month}/${form.renewal_day}`} />
            <Field label="Grace Period" value={`${form.grace_period_months} months`} />
            <Field label="Exam Type" value={form.exam_type} />
            <Field label="Pass Rate" value={`${form.pass_rate}%`} />
            <Field label="Free Attempts" value={form.free_attempts} />
            <Field label="Prerequisites" value={form.prerequisites || "None"} />
          </div>
          {form.description && (
            <div className="mt-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Description (EN)</p>
              <p className="text-sm">{form.description}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Edit mode
  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Edit Details</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
              <X className="h-4 w-4 me-1" /> Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin me-1" />
              ) : (
                <Save className="h-4 w-4 me-1" />
              )}
              Save
            </Button>
          </div>
        </div>

        {/* Name */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Name (English) *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium">Name (Arabic)</label>
            <input dir="rtl" value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} className={inputClass} />
          </div>
        </div>

        {/* Abbreviation & Slug */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Abbreviation *</label>
            <input value={form.abbreviation} onChange={(e) => setForm({ ...form, abbreviation: e.target.value.toUpperCase() })} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium">Slug *</label>
            <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={inputClass} />
          </div>
        </div>

        {/* Description */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Description (EN)</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium">Description (AR)</label>
            <textarea rows={3} dir="rtl" value={form.description_ar} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} className={inputClass} />
          </div>
        </div>

        {/* Tier & Exam */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium">Tier Level</label>
            <select value={form.tier_level} onChange={(e) => setForm({ ...form, tier_level: e.target.value })} className={inputClass}>
              <option value="gateway">Gateway</option>
              <option value="professional">Professional</option>
              <option value="executive">Executive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Exam Type</label>
            <select value={form.exam_type} onChange={(e) => setForm({ ...form, exam_type: e.target.value })} className={inputClass}>
              <option value="multiple_choice">Multiple Choice</option>
              <option value="simulation">Simulation</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Pass Rate (%)</label>
            <input type="number" min="0" max="100" value={form.pass_rate} onChange={(e) => setForm({ ...form, pass_rate: e.target.value })} className={inputClass} />
          </div>
        </div>

        {/* Fees */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-sm font-medium">Founding Fee</label>
            <input type="number" min="0" step="0.01" value={form.founding_fee} onChange={(e) => setForm({ ...form, founding_fee: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium">Renewal Fee</label>
            <input type="number" min="0" step="0.01" value={form.renewal_fee} onChange={(e) => setForm({ ...form, renewal_fee: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium">Late Fee</label>
            <input type="number" min="0" step="0.01" value={form.late_fee} onChange={(e) => setForm({ ...form, late_fee: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium">Reinstatement Fee</label>
            <input type="number" min="0" step="0.01" value={form.reinstatement_fee} onChange={(e) => setForm({ ...form, reinstatement_fee: e.target.value })} className={inputClass} />
          </div>
        </div>

        {/* CPE Settings */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-sm font-medium">Annual CPE Hours</label>
            <input type="number" min="0" value={form.annual_cpe_required} onChange={(e) => setForm({ ...form, annual_cpe_required: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium">CPE Cycle (years)</label>
            <input type="number" min="1" value={form.cpe_cycle_years} onChange={(e) => setForm({ ...form, cpe_cycle_years: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium">CPE Cycle (hours)</label>
            <input type="number" min="0" value={form.cpe_cycle_hours} onChange={(e) => setForm({ ...form, cpe_cycle_hours: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium">Free Attempts</label>
            <input type="number" min="0" value={form.free_attempts} onChange={(e) => setForm({ ...form, free_attempts: e.target.value })} className={inputClass} />
          </div>
        </div>

        {/* Renewal & Grace */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium">Renewal Month (1-12)</label>
            <input type="number" min="1" max="12" value={form.renewal_month} onChange={(e) => setForm({ ...form, renewal_month: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium">Renewal Day</label>
            <input type="number" min="1" max="31" value={form.renewal_day} onChange={(e) => setForm({ ...form, renewal_day: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium">Grace Period (months)</label>
            <input type="number" min="0" value={form.grace_period_months} onChange={(e) => setForm({ ...form, grace_period_months: e.target.value })} className={inputClass} />
          </div>
        </div>

        {/* Prerequisites & Currency & Active */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium">Prerequisites</label>
            <input value={form.prerequisites} onChange={(e) => setForm({ ...form, prerequisites: e.target.value })} placeholder="CDIP, CASP" className={inputClass} />
            <p className="mt-1 text-xs text-muted-foreground">Comma-separated abbreviations</p>
          </div>
          <div>
            <label className="block text-sm font-medium">Currency</label>
            <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className={inputClass}>
              <option value="USD">USD</option>
              <option value="AED">AED</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="h-4 w-4 rounded border-border text-primary" />
              Active
            </label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ===========================================================================
// TIERS TAB
// ===========================================================================
function TiersTab({
  designationId,
  initialTiers,
}: {
  designationId: string;
  initialTiers: DesignationTier[];
}) {
  const [tiers, setTiers] = useState<DesignationTier[]>(initialTiers);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const emptyForm = { name: "", name_ar: "", slug: "", description: "", description_ar: "", sort_order: "0", is_active: true };
  const [form, setForm] = useState(emptyForm);

  const openEdit = (tier: DesignationTier) => {
    setForm({
      name: tier.name,
      name_ar: tier.name_ar ?? "",
      slug: tier.slug,
      description: tier.description ?? "",
      description_ar: tier.description_ar ?? "",
      sort_order: String(tier.sort_order),
      is_active: tier.is_active,
    });
    setEditId(tier.id);
    setShowForm(true);
  };

  const openAdd = () => {
    setForm(emptyForm);
    setEditId(null);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setIsSaving(true);
    try {
      const supabase = createClient();
      const payload = {
        designation_id: designationId,
        name: form.name.trim(),
        name_ar: form.name_ar.trim() || null,
        slug: form.slug.trim() || form.name.toLowerCase().replace(/\s+/g, "-"),
        description: form.description.trim() || null,
        description_ar: form.description_ar.trim() || null,
        sort_order: parseInt(form.sort_order) || 0,
        is_active: form.is_active,
      };

      if (editId) {
        const { data, error } = await supabase.from("designation_tiers").update(payload).eq("id", editId).select().single();
        if (error) throw error;
        setTiers((prev) => prev.map((t) => (t.id === editId ? (data as DesignationTier) : t)));
        toast.success("Tier updated");
      } else {
        const { data, error } = await supabase.from("designation_tiers").insert(payload).select().single();
        if (error) throw error;
        setTiers((prev) => [...prev, data as DesignationTier]);
        toast.success("Tier added");
      }
      setShowForm(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save tier");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this tier?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("designation_tiers").delete().eq("id", id);
    if (!error) {
      setTiers((prev) => prev.filter((t) => t.id !== id));
      toast.success("Tier deleted");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Designation Tiers</h2>
        <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 me-1" /> Add Tier</Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium">Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium">Name (Arabic)</label>
                <input dir="rtl" value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} className={inputClass} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium">Slug</label>
                <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-generated" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium">Sort Order</label>
                <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} className={inputClass} />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="h-4 w-4 rounded border-border text-primary" />
                  Active
                </label>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin me-1" /> : <Save className="h-4 w-4 me-1" />}
                {editId ? "Update" : "Add"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {tiers.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No tiers configured. Add your first tier.</p>
      ) : (
        <div className="space-y-2">
          {tiers.map((tier) => (
            <Card key={tier.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{tier.name}</p>
                  <p className="text-xs text-muted-foreground">{tier.slug} · Order: {tier.sort_order}</p>
                </div>
                <div className="flex items-center gap-2">
                  {tier.is_active ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(tier)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-error" onClick={() => handleDelete(tier.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// CPE CATEGORIES TAB
// ===========================================================================
function CPETab({
  designationId,
  initialCategories,
}: {
  designationId: string;
  initialCategories: CPECategory[];
}) {
  const [categories, setCategories] = useState<CPECategory[]>(initialCategories);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const emptyForm = { name: "", name_ar: "", description: "", annual_max_hours: "", hour_rate: "1", requires_approval: false, sort_order: "0" };
  const [form, setForm] = useState(emptyForm);

  const openEdit = (cat: CPECategory) => {
    setForm({
      name: cat.name,
      name_ar: cat.name_ar ?? "",
      description: cat.description ?? "",
      annual_max_hours: cat.annual_max_hours ? String(cat.annual_max_hours) : "",
      hour_rate: String(cat.hour_rate ?? 1),
      requires_approval: cat.requires_approval,
      sort_order: String(cat.sort_order),
    });
    setEditId(cat.id);
    setShowForm(true);
  };

  const openAdd = () => { setForm(emptyForm); setEditId(null); setShowForm(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setIsSaving(true);
    try {
      const supabase = createClient();
      const payload = {
        designation_id: designationId,
        name: form.name.trim(),
        name_ar: form.name_ar.trim() || null,
        description: form.description.trim() || null,
        annual_max_hours: form.annual_max_hours ? parseInt(form.annual_max_hours) : null,
        hour_rate: parseFloat(form.hour_rate) || 1,
        requires_approval: form.requires_approval,
        sort_order: parseInt(form.sort_order) || 0,
      };

      if (editId) {
        const { data, error } = await supabase.from("cpe_categories").update(payload).eq("id", editId).select().single();
        if (error) throw error;
        setCategories((prev) => prev.map((c) => (c.id === editId ? (data as CPECategory) : c)));
        toast.success("Category updated");
      } else {
        const { data, error } = await supabase.from("cpe_categories").insert(payload).select().single();
        if (error) throw error;
        setCategories((prev) => [...prev, data as CPECategory]);
        toast.success("Category added");
      }
      setShowForm(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this CPE category?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("cpe_categories").delete().eq("id", id);
    if (!error) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success("Category deleted");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">CPE Categories</h2>
        <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 me-1" /> Add Category</Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium">Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium">Name (Arabic)</label>
                <input dir="rtl" value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} className={inputClass} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium">Description</label>
              <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} />
            </div>
            <div className="grid gap-4 sm:grid-cols-4">
              <div>
                <label className="block text-sm font-medium">Max Hours/Year</label>
                <input type="number" value={form.annual_max_hours} onChange={(e) => setForm({ ...form, annual_max_hours: e.target.value })} placeholder="Unlimited" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium">Hour Rate</label>
                <input type="number" step="0.1" value={form.hour_rate} onChange={(e) => setForm({ ...form, hour_rate: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium">Sort Order</label>
                <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} className={inputClass} />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.requires_approval} onChange={(e) => setForm({ ...form, requires_approval: e.target.checked })} className="h-4 w-4 rounded border-border text-primary" />
                  Requires Approval
                </label>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin me-1" /> : <Save className="h-4 w-4 me-1" />}
                {editId ? "Update" : "Add"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No CPE categories. Add your first category.</p>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <Card key={cat.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{cat.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Max: {cat.annual_max_hours ?? "Unlimited"} hrs/yr · Rate: {cat.hour_rate}x
                    {cat.requires_approval && " · Approval required"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(cat)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-error" onClick={() => handleDelete(cat.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// DOCUMENTS TAB
// ===========================================================================
function DocumentsTab({
  designationId,
  initialDocuments,
}: {
  designationId: string;
  initialDocuments: DesignationDocument[];
}) {
  const [docs, setDocs] = useState<DesignationDocument[]>(initialDocuments);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (doc: DesignationDocument) => {
    if (!doc.file_url) return;
    setDownloading(doc.id);
    try {
      const supabase = createClient();
      const path = doc.file_url.replace("designation-documents/", "");
      const { data, error } = await supabase.storage
        .from("designation-documents")
        .createSignedUrl(path, 60);
      if (error || !data?.signedUrl) throw new Error("Failed to generate download link");
      const link = document.createElement("a");
      link.href = data.signedUrl;
      link.download = `${doc.title}.${doc.file_type || "pdf"}`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloading(null);
    }
  };

  const emptyForm = { title: "", title_ar: "", description: "", file_url: "", file_type: "pdf", access_level: "active_holder", sort_order: "0" };
  const [form, setForm] = useState(emptyForm);

  const openEdit = (doc: DesignationDocument) => {
    setForm({
      title: doc.title,
      title_ar: doc.title_ar ?? "",
      description: doc.description ?? "",
      file_url: doc.file_url ?? "",
      file_type: doc.file_type ?? "pdf",
      access_level: doc.access_level,
      sort_order: String(doc.sort_order),
    });
    setEditId(doc.id);
    setShowForm(true);
  };

  const openAdd = () => { setForm(emptyForm); setEditId(null); setShowForm(true); };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setIsSaving(true);
    try {
      const supabase = createClient();
      const payload = {
        designation_id: designationId,
        title: form.title.trim(),
        title_ar: form.title_ar.trim() || null,
        description: form.description.trim() || null,
        file_url: form.file_url.trim() || null,
        file_type: form.file_type,
        access_level: form.access_level,
        sort_order: parseInt(form.sort_order) || 0,
      };

      if (editId) {
        const { data, error } = await supabase.from("designation_documents").update(payload).eq("id", editId).select().single();
        if (error) throw error;
        setDocs((prev) => prev.map((d) => (d.id === editId ? (data as DesignationDocument) : d)));
        toast.success("Document updated");
      } else {
        const { data, error } = await supabase.from("designation_documents").insert(payload).select().single();
        if (error) throw error;
        setDocs((prev) => [...prev, data as DesignationDocument]);
        toast.success("Document added");
      }
      setShowForm(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this document?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("designation_documents").delete().eq("id", id);
    if (!error) {
      setDocs((prev) => prev.filter((d) => d.id !== id));
      toast.success("Document deleted");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Documents</h2>
        <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 me-1" /> Add Document</Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium">Title *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium">Title (Arabic)</label>
                <input dir="rtl" value={form.title_ar} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} className={inputClass} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium">Description</label>
              <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium">File URL</label>
                <input value={form.file_url} onChange={(e) => setForm({ ...form, file_url: e.target.value })} placeholder="https://..." className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium">Access Level</label>
                <select value={form.access_level} onChange={(e) => setForm({ ...form, access_level: e.target.value })} className={inputClass}>
                  <option value="active_holder">Active Holder</option>
                  <option value="all">All Members</option>
                  <option value="public">Public</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Sort Order</label>
                <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} className={inputClass} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin me-1" /> : <Save className="h-4 w-4 me-1" />}
                {editId ? "Update" : "Add"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {docs.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No documents. Add your first document.</p>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{doc.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {doc.file_type?.toUpperCase()} · Access: {doc.access_level} · Downloads: {doc.download_count}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {doc.file_url && (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleDownload(doc)} disabled={downloading === doc.id} title="Download">
                      {downloading === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(doc)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-error" onClick={() => handleDelete(doc.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// HOLDERS TAB (Read-only)
// ===========================================================================
function HoldersTab({
  designationId,
  holderCount,
}: {
  designationId: string;
  holderCount: number;
}) {
  const [holders, setHolders] = useState<{ id: string; member_number: string; status: string; certified_at: string; profile: { full_name: string } | null }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useState(() => {
    async function fetch() {
      const supabase = createClient();
      const { data } = await supabase
        .from("designation_holders")
        .select("id, member_number, status, certified_at, profile:profiles!designation_holders_user_id_fkey(full_name)")
        .eq("designation_id", designationId)
        .order("certified_at", { ascending: true })
        .limit(100);

      const list = (data ?? []).map((h: unknown) => {
        const raw = h as { id: string; member_number: string; status: string; certified_at: string; profile: { full_name: string }[] };
        return { ...raw, profile: raw.profile?.[0] ?? null };
      });

      setHolders(list);
      setIsLoading(false);
    }
    fetch();
  });

  const statusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge variant="success">Active</Badge>;
      case "grace_period": return <Badge variant="warning">Grace</Badge>;
      case "suspended": return <Badge variant="destructive">Suspended</Badge>;
      case "lapsed": return <Badge variant="secondary">Lapsed</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Credential Holders</h2>
        <Badge variant="info">{holderCount} active</Badge>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : holders.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No holders found.</p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">Member #</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">Certified</th>
                </tr>
              </thead>
              <tbody>
                {holders.map((h) => (
                  <tr key={h.id} className="border-b last:border-0">
                    <td className="px-4 py-3">{h.profile?.full_name ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs hidden sm:table-cell">{h.member_number}</td>
                    <td className="px-4 py-3">{statusBadge(h.status)}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {new Date(h.certified_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ===========================================================================
// Helpers
// ===========================================================================
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5">{value || "—"}</p>
    </div>
  );
}
