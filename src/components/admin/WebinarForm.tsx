"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { webinarSchema, type WebinarInput } from "@/lib/utils/validators";
import { createZoomMeeting } from "@/lib/services/zoom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

interface WebinarFormProps {
  initialData?: Partial<WebinarInput> & { id?: string };
  mode: "create" | "edit";
}

interface CategoryOption {
  id: string;
  name: string;
  name_ar: string;
}

interface InstructorOption {
  id: string;
  full_name: string;
}

const CURRENCIES = ["USD", "AED", "SAR", "BHD", "OMR", "KWD", "QAR", "EGP", "GBP", "EUR"];

export function WebinarForm({ initialData, mode }: WebinarFormProps) {
  const locale = useLocale();
  const router = useRouter();

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [instructors, setInstructors] = useState<InstructorOption[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<WebinarInput>({
    resolver: zodResolver(webinarSchema),
    defaultValues: {
      title: initialData?.title ?? "",
      titleAr: initialData?.titleAr ?? "",
      description: initialData?.description ?? "",
      descriptionAr: initialData?.descriptionAr ?? "",
      instructorId: initialData?.instructorId ?? "",
      categoryId: initialData?.categoryId ?? "",
      scheduledAt: initialData?.scheduledAt ?? "",
      durationMinutes: initialData?.durationMinutes ?? 60,
      maxAttendees: initialData?.maxAttendees ?? 100,
      isFree: initialData?.isFree ?? true,
      price: initialData?.price ?? 0,
      currency: initialData?.currency ?? "USD",
      tags: initialData?.tags ?? [],
    },
  });

  const watchedIsFree = watch("isFree");

  useEffect(() => {
    async function fetchData() {
      setIsLoadingData(true);
      const supabase = createClient();

      const [categoriesRes, instructorsRes] = await Promise.all([
        supabase
          .from("categories")
          .select("id, name, name_ar")
          .eq("is_active", true)
          .order("sort_order"),
        supabase
          .from("profiles")
          .select("id, full_name")
          .in("role", ["instructor", "super_admin"])
          .eq("is_active", true)
          .order("full_name"),
      ]);

      setCategories((categoriesRes.data as CategoryOption[]) ?? []);
      setInstructors((instructorsRes.data as InstructorOption[]) ?? []);
      setIsLoadingData(false);
    }

    fetchData();
  }, []);

  useEffect(() => {
    setValue("tags", tags);
  }, [tags, setValue]);

  const addTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
      setTagInput("");
    }
  };

  const removeTag = (index: number) => {
    setTags((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: WebinarInput) => {
    setSubmitError(null);

    try {
      const supabase = createClient();

      // Create Zoom meeting (stub)
      const zoomResult = await createZoomMeeting({
        title: data.title,
        scheduledAt: data.scheduledAt,
        durationMinutes: data.durationMinutes,
      });

      const webinarPayload: Record<string, unknown> = {
        title: data.title,
        title_ar: data.titleAr || null,
        description: data.description,
        description_ar: data.descriptionAr || null,
        instructor_id: data.instructorId || null,
        category_id: data.categoryId || null,
        scheduled_at: data.scheduledAt,
        duration_minutes: data.durationMinutes,
        max_attendees: data.maxAttendees || null,
        is_free: data.isFree,
        price: data.isFree ? 0 : data.price,
        currency: data.currency,
        tags: data.tags ?? [],
        meeting_id: zoomResult.meetingId,
        meeting_url: zoomResult.joinUrl,
        status: "scheduled",
      };

      if (mode === "edit" && initialData?.id) {
        const { error } = await supabase
          .from("webinars")
          .update(webinarPayload)
          .eq("id", initialData.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("webinars")
          .insert(webinarPayload);

        if (error) throw error;
      }

      router.push(`/${locale}/admin/webinars`);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setSubmitError(message);
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>
            {mode === "edit" ? "Edit Webinar" : "Create New Webinar"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {submitError && (
              <div className="rounded-md bg-error/10 px-4 py-3 text-sm text-error">
                {submitError}
              </div>
            )}

            {/* Title */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Title (English) *</Label>
                <Input
                  id="title"
                  placeholder="e.g. Financial Risk Management Masterclass"
                  {...register("title")}
                />
                {errors.title && (
                  <p className="text-sm text-error">{errors.title.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="titleAr">Title (Arabic)</Label>
                <Input
                  id="titleAr"
                  dir="rtl"
                  placeholder="العنوان بالعربية"
                  {...register("titleAr")}
                />
              </div>
            </div>

            {/* Description */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="description">Description (English) *</Label>
                <Textarea
                  id="description"
                  placeholder="Webinar description..."
                  rows={4}
                  {...register("description")}
                />
                {errors.description && (
                  <p className="text-sm text-error">{errors.description.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="descriptionAr">Description (Arabic)</Label>
                <Textarea
                  id="descriptionAr"
                  dir="rtl"
                  placeholder="وصف الندوة..."
                  rows={4}
                  {...register("descriptionAr")}
                />
              </div>
            </div>

            {/* Instructor & Category */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="instructorId">Instructor</Label>
                <select
                  id="instructorId"
                  className={cn(
                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  )}
                  {...register("instructorId")}
                >
                  <option value="">Select an instructor</option>
                  {instructors.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryId">Category</Label>
                <select
                  id="categoryId"
                  className={cn(
                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  )}
                  {...register("categoryId")}
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {locale === "ar" ? cat.name_ar || cat.name : cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Schedule & Duration */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="scheduledAt">Scheduled Date & Time *</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  {...register("scheduledAt")}
                />
                {errors.scheduledAt && (
                  <p className="text-sm text-error">{errors.scheduledAt.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="durationMinutes">Duration (minutes) *</Label>
                <Input
                  id="durationMinutes"
                  type="number"
                  min={15}
                  max={480}
                  {...register("durationMinutes", { valueAsNumber: true })}
                />
                {errors.durationMinutes && (
                  <p className="text-sm text-error">{errors.durationMinutes.message}</p>
                )}
              </div>
            </div>

            {/* Max Attendees */}
            <div className="space-y-2 sm:max-w-xs">
              <Label htmlFor="maxAttendees">Max Attendees</Label>
              <Input
                id="maxAttendees"
                type="number"
                min={1}
                {...register("maxAttendees", { valueAsNumber: true })}
              />
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Pricing</h3>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isFree"
                  className="h-4 w-4 rounded border-input"
                  {...register("isFree")}
                />
                <Label htmlFor="isFree" className="cursor-pointer">
                  This is a free webinar
                </Label>
              </div>

              {!watchedIsFree && (
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price *</Label>
                    <Input
                      id="price"
                      type="number"
                      min={0}
                      step="0.01"
                      {...register("price", { valueAsNumber: true })}
                    />
                    {errors.price && (
                      <p className="text-sm text-error">{errors.price.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <select
                      id="currency"
                      className={cn(
                        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      )}
                      {...register("currency")}
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="space-y-3">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="e.g. finance, risk, webinar"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  <Plus className="h-4 w-4 me-1" />
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(index)}
                        className="hover:text-error transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/${locale}/admin/webinars`)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin me-2" />}
                {mode === "edit" ? "Update Webinar" : "Create Webinar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
