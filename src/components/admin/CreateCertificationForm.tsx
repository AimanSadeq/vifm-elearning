"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

const inputClass =
  "mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export function CreateCertificationForm() {
  const router = useRouter();
  const locale = useLocale();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    name_ar: "",
    abbreviation: "",
    slug: "",
    description: "",
    description_ar: "",
    tier_level: "gateway" as string,
    founding_fee: "0",
    renewal_fee: "70",
    currency: "USD",
    annual_cpe_required: "20",
    is_active: true,
  });

  // Auto-generate slug from name
  useEffect(() => {
    if (form.name) {
      const slug = form.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      setForm((prev) => ({ ...prev, slug }));
    }
  }, [form.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Certification name is required");
      return;
    }
    if (!form.abbreviation.trim()) {
      toast.error("Abbreviation is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("designations")
        .insert({
          name: form.name.trim(),
          name_ar: form.name_ar.trim() || null,
          abbreviation: form.abbreviation.trim().toUpperCase(),
          slug: form.slug.trim(),
          description: form.description.trim() || null,
          description_ar: form.description_ar.trim() || null,
          founding_fee: parseFloat(form.founding_fee) || 0,
          renewal_fee: parseFloat(form.renewal_fee) || 70,
          currency: form.currency,
          annual_cpe_required: parseInt(form.annual_cpe_required) || 20,
          is_active: form.is_active,
          metadata: { tier_level: form.tier_level },
        })
        .select("id")
        .single();

      if (error) throw error;

      toast.success("Certification created! Redirecting to editor...");
      router.push(`/${locale}/admin/certifications/${data.id}/edit`);
    } catch (error: unknown) {
      console.error("Error creating certification:", error);
      const msg =
        error instanceof Error ? error.message : "Failed to create certification";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-lg border border-border bg-card p-6"
      >
        {/* Name */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-foreground">
              Certification Name (English) *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Certified AI Financial Analyst"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">
              Certification Name (Arabic)
            </label>
            <input
              type="text"
              dir="rtl"
              value={form.name_ar}
              onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
              placeholder="محلل مالي معتمد بالذكاء الاصطناعي"
              className={inputClass}
            />
          </div>
        </div>

        {/* Abbreviation & Slug */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-foreground">
              Abbreviation *
            </label>
            <input
              type="text"
              required
              value={form.abbreviation}
              onChange={(e) =>
                setForm({ ...form, abbreviation: e.target.value.toUpperCase() })
              }
              placeholder="e.g., CAFA"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Short code displayed on badges. Must be unique.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">
              URL Slug *
            </label>
            <input
              type="text"
              required
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Auto-generated from name. Must be unique.
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-foreground">
              Description (English)
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">
              Description (Arabic)
            </label>
            <textarea
              rows={3}
              dir="rtl"
              value={form.description_ar}
              onChange={(e) =>
                setForm({ ...form, description_ar: e.target.value })
              }
              className={inputClass}
            />
          </div>
        </div>

        {/* Tier Level & Fees */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-foreground">
              Tier Level *
            </label>
            <select
              value={form.tier_level}
              onChange={(e) => setForm({ ...form, tier_level: e.target.value })}
              className={inputClass}
            >
              <option value="gateway">Gateway</option>
              <option value="professional">Professional</option>
              <option value="executive">Executive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">
              Founding Fee
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.founding_fee}
              onChange={(e) =>
                setForm({ ...form, founding_fee: e.target.value })
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">
              Renewal Fee
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.renewal_fee}
              onChange={(e) =>
                setForm({ ...form, renewal_fee: e.target.value })
              }
              className={inputClass}
            />
          </div>
        </div>

        {/* CPE & Currency */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-foreground">
              Annual CPE Hours
            </label>
            <input
              type="number"
              min="0"
              value={form.annual_cpe_required}
              onChange={(e) =>
                setForm({ ...form, annual_cpe_required: e.target.value })
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">
              Currency
            </label>
            <select
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className={inputClass}
            >
              <option value="USD">USD</option>
              <option value="AED">AED</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) =>
                  setForm({ ...form, is_active: e.target.checked })
                }
                className="h-4 w-4 rounded border-border text-primary"
              />
              Active on launch
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 border-t border-border pt-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Create Certification
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
