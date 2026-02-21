"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  certificateTemplateSchema,
  type CertificateTemplateInput,
} from "@/lib/utils/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CertificatePreview } from "./CertificatePreview";

interface CertificateTemplateFormProps {
  initialData?: Partial<CertificateTemplateInput> & { id?: string };
  onSubmit: (data: CertificateTemplateInput) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CertificateTemplateForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}: CertificateTemplateFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CertificateTemplateInput>({
    resolver: zodResolver(certificateTemplateSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      nameAr: initialData?.nameAr ?? "",
      templateKey: initialData?.templateKey ?? "classic",
      primaryColor: initialData?.primaryColor ?? "#1A3A5F",
      secondaryColor: initialData?.secondaryColor ?? "#D4AF37",
      accentColor: initialData?.accentColor ?? "#646464",
      logoUrl: initialData?.logoUrl ?? "",
      organizationName:
        initialData?.organizationName ??
        "Virginia Institute of Finance and Management",
      organizationNameAr: initialData?.organizationNameAr ?? "",
      isDefault: initialData?.isDefault ?? false,
      isActive: initialData?.isActive ?? true,
    },
  });

  const templateKey = watch("templateKey");
  const primaryColor = watch("primaryColor");
  const secondaryColor = watch("secondaryColor");
  const accentColor = watch("accentColor");
  const organizationName = watch("organizationName");

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold">
          {initialData?.id ? "Edit Template" : "Create Template"}
        </h3>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Row 1: Name & Name AR */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="e.g. Corporate Blue"
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nameAr">Name (Arabic)</Label>
              <Input
                id="nameAr"
                {...register("nameAr")}
                placeholder="الاسم بالعربية"
                dir="rtl"
              />
            </div>
          </div>

          {/* Row 2: Template Key & Organization */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="templateKey">Template Style</Label>
              <select
                id="templateKey"
                {...register("templateKey")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="classic">Classic</option>
                <option value="modern">Modern</option>
                <option value="corporate">Corporate</option>
                <option value="elegant">Elegant</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="organizationName">Organization Name</Label>
              <Input
                id="organizationName"
                {...register("organizationName")}
              />
              {errors.organizationName && (
                <p className="text-sm text-destructive">
                  {errors.organizationName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="organizationNameAr">Organization (Arabic)</Label>
              <Input
                id="organizationNameAr"
                {...register("organizationNameAr")}
                dir="rtl"
              />
            </div>
          </div>

          {/* Row 3: Colors */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  {...register("primaryColor")}
                  className="h-10 w-12 cursor-pointer rounded border border-input"
                />
                <Input
                  id="primaryColor"
                  {...register("primaryColor")}
                  placeholder="#1A3A5F"
                  className="flex-1"
                />
              </div>
              {errors.primaryColor && (
                <p className="text-sm text-destructive">
                  {errors.primaryColor.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  {...register("secondaryColor")}
                  className="h-10 w-12 cursor-pointer rounded border border-input"
                />
                <Input
                  id="secondaryColor"
                  {...register("secondaryColor")}
                  placeholder="#D4AF37"
                  className="flex-1"
                />
              </div>
              {errors.secondaryColor && (
                <p className="text-sm text-destructive">
                  {errors.secondaryColor.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="accentColor">Accent Color</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  {...register("accentColor")}
                  className="h-10 w-12 cursor-pointer rounded border border-input"
                />
                <Input
                  id="accentColor"
                  {...register("accentColor")}
                  placeholder="#646464"
                  className="flex-1"
                />
              </div>
              {errors.accentColor && (
                <p className="text-sm text-destructive">
                  {errors.accentColor.message}
                </p>
              )}
            </div>
          </div>

          {/* Row 4: Logo URL */}
          <div className="space-y-2">
            <Label htmlFor="logoUrl">
              Logo URL{" "}
              <span className="text-xs text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="logoUrl"
              {...register("logoUrl")}
              placeholder="https://example.com/logo.png"
            />
          </div>

          {/* Row 5: Toggles */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                {...register("isDefault")}
                className="rounded border-input"
              />
              Default Template
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                {...register("isActive")}
                className="rounded border-input"
              />
              Active
            </label>
          </div>

          {/* Live Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <CertificatePreview
              templateKey={templateKey}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              accentColor={accentColor}
              organizationName={organizationName}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? "Saving..."
                : initialData?.id
                  ? "Update Template"
                  : "Create Template"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
