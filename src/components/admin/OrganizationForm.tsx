"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { organizationSchema, type OrganizationInput } from "@/lib/utils/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

interface OrganizationFormProps {
  initialData?: Partial<OrganizationInput> & { id?: string; slug?: string };
  mode: "create" | "edit";
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function OrganizationForm({ initialData, mode }: OrganizationFormProps) {
  const locale = useLocale();
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OrganizationInput>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      nameAr: initialData?.nameAr ?? "",
      domain: initialData?.domain ?? "",
      contactEmail: initialData?.contactEmail ?? "",
      contactPhone: initialData?.contactPhone ?? "",
      address: initialData?.address ?? "",
      licenseType: initialData?.licenseType ?? "per_seat",
      maxSeats: initialData?.maxSeats ?? undefined,
      licenseStartDate: initialData?.licenseStartDate ?? "",
      licenseEndDate: initialData?.licenseEndDate ?? "",
    },
  });

  const onSubmit = async (data: OrganizationInput) => {
    setSubmitError(null);

    try {
      const supabase = createClient();
      const slug = initialData?.slug ?? generateSlug(data.name);

      const payload: Record<string, unknown> = {
        name: data.name,
        name_ar: data.nameAr || null,
        slug,
        domain: data.domain || null,
        contact_email: data.contactEmail,
        contact_phone: data.contactPhone || null,
        address: data.address || null,
        license_type: data.licenseType,
        max_seats: data.maxSeats || 0,
        license_start_date: data.licenseStartDate || null,
        license_end_date: data.licenseEndDate || null,
      };

      if (mode === "edit" && initialData?.id) {
        const { error } = await supabase
          .from("organizations")
          .update(payload)
          .eq("id", initialData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("organizations").insert(payload);
        if (error) throw error;
      }

      router.push(`/${locale}/admin/organizations`);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setSubmitError(message);
    }
  };

  return (
    <div className="mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>
            {mode === "edit" ? "Edit Organization" : "Create Organization"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {submitError && (
              <div className="rounded-md bg-error/10 px-4 py-3 text-sm text-error">
                {submitError}
              </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name (English) *</Label>
                <Input id="name" {...register("name")} />
                {errors.name && (
                  <p className="text-sm text-error">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameAr">Name (Arabic)</Label>
                <Input id="nameAr" dir="rtl" {...register("nameAr")} />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email *</Label>
                <Input id="contactEmail" type="email" {...register("contactEmail")} />
                {errors.contactEmail && (
                  <p className="text-sm text-error">{errors.contactEmail.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input id="contactPhone" type="tel" {...register("contactPhone")} />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input id="domain" placeholder="company.com" {...register("domain")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" {...register("address")} />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="licenseType">License Type</Label>
                <select
                  id="licenseType"
                  className={cn(
                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  )}
                  {...register("licenseType")}
                >
                  <option value="per_seat">Per Seat</option>
                  <option value="unlimited">Unlimited</option>
                  <option value="course_bundle">Course Bundle</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxSeats">Max Seats</Label>
                <Input
                  id="maxSeats"
                  type="number"
                  min={0}
                  {...register("maxSeats", { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="licenseStartDate">License Start</Label>
                <Input
                  id="licenseStartDate"
                  type="date"
                  {...register("licenseStartDate")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="licenseEndDate">License End</Label>
                <Input
                  id="licenseEndDate"
                  type="date"
                  {...register("licenseEndDate")}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/${locale}/admin/organizations`)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin me-2" />}
                {mode === "edit" ? "Update" : "Create Organization"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
