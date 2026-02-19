"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, X, Check, ChevronRight, ChevronLeft, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { courseSchema, type CourseInput } from "@/lib/utils/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

interface CourseFormProps {
  initialData?: Partial<CourseInput> & { id?: string; slug?: string; status?: string };
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

const STEPS = [
  { number: 1, label: "Basic Info" },
  { number: 2, label: "Settings" },
  { number: 3, label: "Review & Publish" },
];

const DIFFICULTY_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "expert", label: "Expert" },
] as const;

const CURRENCIES = ["USD", "AED", "SAR", "BHD", "OMR", "KWD", "QAR", "EGP", "GBP", "EUR"];

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CourseForm({ initialData, mode }: CourseFormProps) {
  const locale = useLocale();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [instructors, setInstructors] = useState<InstructorOption[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    initialData?.slug ? null : null
  );

  // Array field inputs
  const [outcomeInput, setOutcomeInput] = useState("");
  const [outcomeArInput, setOutcomeArInput] = useState("");
  const [tagInput, setTagInput] = useState("");

  // Array field state
  const [learningOutcomes, setLearningOutcomes] = useState<string[]>(
    initialData?.learningOutcomes ?? []
  );
  const [learningOutcomesAr, setLearningOutcomesAr] = useState<string[]>(
    initialData?.learningOutcomesAr ?? []
  );
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<CourseInput>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: initialData?.title ?? "",
      titleAr: initialData?.titleAr ?? "",
      description: initialData?.description ?? "",
      descriptionAr: initialData?.descriptionAr ?? "",
      shortDescription: initialData?.shortDescription ?? "",
      shortDescriptionAr: initialData?.shortDescriptionAr ?? "",
      categoryId: initialData?.categoryId ?? "",
      instructorId: initialData?.instructorId ?? "",
      difficultyLevel: initialData?.difficultyLevel ?? "beginner",
      price: initialData?.price ?? 0,
      currency: initialData?.currency ?? "USD",
      isFree: initialData?.isFree ?? false,
      isFeatured: initialData?.isFeatured ?? false,
      certificateEnabled: initialData?.certificateEnabled ?? true,
      passingScore: initialData?.passingScore ?? 70,
      learningOutcomes: initialData?.learningOutcomes ?? [],
      learningOutcomesAr: initialData?.learningOutcomesAr ?? [],
      tags: initialData?.tags ?? [],
    },
  });

  const watchedValues = watch();

  // Fetch categories and instructors on mount
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

  // Sync array fields with form
  useEffect(() => {
    setValue("learningOutcomes", learningOutcomes);
  }, [learningOutcomes, setValue]);

  useEffect(() => {
    setValue("learningOutcomesAr", learningOutcomesAr);
  }, [learningOutcomesAr, setValue]);

  useEffect(() => {
    setValue("tags", tags);
  }, [tags, setValue]);

  // Array field handlers
  const addOutcome = () => {
    const trimmed = outcomeInput.trim();
    if (trimmed && !learningOutcomes.includes(trimmed)) {
      setLearningOutcomes((prev) => [...prev, trimmed]);
      setOutcomeInput("");
    }
  };

  const removeOutcome = (index: number) => {
    setLearningOutcomes((prev) => prev.filter((_, i) => i !== index));
  };

  const addOutcomeAr = () => {
    const trimmed = outcomeArInput.trim();
    if (trimmed && !learningOutcomesAr.includes(trimmed)) {
      setLearningOutcomesAr((prev) => [...prev, trimmed]);
      setOutcomeArInput("");
    }
  };

  const removeOutcomeAr = (index: number) => {
    setLearningOutcomesAr((prev) => prev.filter((_, i) => i !== index));
  };

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

  // Thumbnail handler
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Step navigation with validation
  const goToNextStep = async () => {
    if (step === 1) {
      const valid = await trigger([
        "title",
        "description",
        "categoryId",
        "difficultyLevel",
        "price",
        "currency",
      ]);
      if (!valid) return;
    }
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const goToPrevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  // Upload thumbnail to Supabase storage
  const uploadThumbnail = async (courseId: string): Promise<string | null> => {
    if (!thumbnailFile) return null;

    const supabase = createClient();
    const fileExt = thumbnailFile.name.split(".").pop();
    const filePath = `courses/${courseId}/thumbnail.${fileExt}`;

    const { error } = await supabase.storage
      .from("course-assets")
      .upload(filePath, thumbnailFile, { upsert: true });

    if (error) {
      console.error("Thumbnail upload error:", error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("course-assets")
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  // Submit handler
  const onSubmit = async (data: CourseInput, status: "draft" | "published") => {
    setSubmitError(null);

    try {
      const supabase = createClient();
      const slug = initialData?.slug ?? generateSlug(data.title);

      const coursePayload: Record<string, unknown> = {
        title: data.title,
        title_ar: data.titleAr || null,
        slug,
        description: data.description,
        description_ar: data.descriptionAr || null,
        short_description: data.shortDescription || null,
        short_description_ar: data.shortDescriptionAr || null,
        category_id: data.categoryId,
        instructor_id: data.instructorId || null,
        difficulty_level: data.difficultyLevel,
        price: data.isFree ? 0 : data.price,
        currency: data.currency,
        is_free: data.isFree,
        is_featured: data.isFeatured,
        certificate_enabled: data.certificateEnabled,
        passing_score: data.passingScore,
        learning_outcomes: data.learningOutcomes ?? [],
        learning_outcomes_ar: data.learningOutcomesAr ?? [],
        tags: data.tags ?? [],
        status,
      };

      if (status === "published") {
        coursePayload.published_at = new Date().toISOString();
      }

      let courseId: string;

      if (mode === "edit" && initialData?.id) {
        courseId = initialData.id;
        const { error } = await supabase
          .from("courses")
          .update(coursePayload)
          .eq("id", courseId);

        if (error) throw error;
      } else {
        const { data: created, error } = await supabase
          .from("courses")
          .insert(coursePayload)
          .select("id")
          .single();

        if (error) throw error;
        courseId = created.id;
      }

      // Upload thumbnail if selected
      if (thumbnailFile) {
        const thumbnailUrl = await uploadThumbnail(courseId);
        if (thumbnailUrl) {
          await supabase
            .from("courses")
            .update({ thumbnail_url: thumbnailUrl })
            .eq("id", courseId);
        }
      }

      router.push(`/${locale}/admin/courses`);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setSubmitError(message);
    }
  };

  // Step indicator
  const StepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-center">
        {STEPS.map((s, index) => (
          <div key={s.number} className="flex items-center">
            <button
              type="button"
              onClick={() => {
                if (s.number < step) setStep(s.number);
              }}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors",
                step === s.number
                  ? "bg-primary text-primary-foreground"
                  : step > s.number
                    ? "bg-primary/20 text-primary cursor-pointer"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {step > s.number ? <Check className="h-5 w-5" /> : s.number}
            </button>
            <span
              className={cn(
                "ms-2 text-sm font-medium hidden sm:inline",
                step === s.number
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {s.label}
            </span>
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-4 h-px w-12 sm:w-20",
                  step > s.number ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // Step 1: Basic Info
  const renderStep1 = () => (
    <div className="space-y-6">
      {/* Title */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Title (English) *</Label>
          <Input
            id="title"
            placeholder="e.g. Introduction to Financial Markets"
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
          {errors.titleAr && (
            <p className="text-sm text-error">{errors.titleAr.message}</p>
          )}
        </div>
      </div>

      {/* Short Description */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="shortDescription">Short Description</Label>
          <Input
            id="shortDescription"
            placeholder="Brief summary (max 200 chars)"
            maxLength={200}
            {...register("shortDescription")}
          />
          {errors.shortDescription && (
            <p className="text-sm text-error">{errors.shortDescription.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="shortDescriptionAr">Short Description (Arabic)</Label>
          <Input
            id="shortDescriptionAr"
            dir="rtl"
            placeholder="وصف مختصر"
            maxLength={200}
            {...register("shortDescriptionAr")}
          />
          {errors.shortDescriptionAr && (
            <p className="text-sm text-error">{errors.shortDescriptionAr.message}</p>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="description">Description (English) *</Label>
          <Textarea
            id="description"
            placeholder="Detailed course description..."
            rows={5}
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
            placeholder="وصف الدورة التفصيلي..."
            rows={5}
            {...register("descriptionAr")}
          />
          {errors.descriptionAr && (
            <p className="text-sm text-error">{errors.descriptionAr.message}</p>
          )}
        </div>
      </div>

      {/* Category & Instructor */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="categoryId">Category *</Label>
          <select
            id="categoryId"
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
          {errors.categoryId && (
            <p className="text-sm text-error">{errors.categoryId.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="instructorId">Instructor</Label>
          <select
            id="instructorId"
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
          {errors.instructorId && (
            <p className="text-sm text-error">{errors.instructorId.message}</p>
          )}
        </div>
      </div>

      {/* Difficulty Level */}
      <div className="space-y-2">
        <Label htmlFor="difficultyLevel">Difficulty Level *</Label>
        <select
          id="difficultyLevel"
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:max-w-xs"
          )}
          {...register("difficultyLevel")}
        >
          {DIFFICULTY_LEVELS.map((level) => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </select>
        {errors.difficultyLevel && (
          <p className="text-sm text-error">{errors.difficultyLevel.message}</p>
        )}
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
            This is a free course
          </Label>
        </div>

        {!watchedValues.isFree && (
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="price">Price *</Label>
              <Input
                id="price"
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
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
                  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                )}
                {...register("currency")}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isFeatured"
            className="h-4 w-4 rounded border-input"
            {...register("isFeatured")}
          />
          <Label htmlFor="isFeatured" className="cursor-pointer">
            Feature this course on the homepage
          </Label>
        </div>
      </div>
    </div>
  );

  // Step 2: Settings
  const renderStep2 = () => (
    <div className="space-y-6">
      {/* Certificate & Passing Score */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Certificate Settings</h3>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="certificateEnabled"
            className="h-4 w-4 rounded border-input"
            {...register("certificateEnabled")}
          />
          <Label htmlFor="certificateEnabled" className="cursor-pointer">
            Enable certificate on completion
          </Label>
        </div>

        {watchedValues.certificateEnabled && (
          <div className="space-y-2 sm:max-w-xs">
            <Label htmlFor="passingScore">Passing Score (%)</Label>
            <Input
              id="passingScore"
              type="number"
              min={0}
              max={100}
              {...register("passingScore", { valueAsNumber: true })}
            />
            {errors.passingScore && (
              <p className="text-sm text-error">{errors.passingScore.message}</p>
            )}
          </div>
        )}
      </div>

      {/* Learning Outcomes (English) */}
      <div className="space-y-3">
        <Label>Learning Outcomes (English)</Label>
        <div className="flex gap-2">
          <Input
            value={outcomeInput}
            onChange={(e) => setOutcomeInput(e.target.value)}
            placeholder="e.g. Understand risk management principles"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addOutcome();
              }
            }}
          />
          <Button type="button" variant="outline" size="default" onClick={addOutcome}>
            <Plus className="h-4 w-4 me-1" />
            Add
          </Button>
        </div>
        {learningOutcomes.length > 0 && (
          <ul className="space-y-2">
            {learningOutcomes.map((outcome, index) => (
              <li
                key={index}
                className="flex items-center justify-between rounded-md border border-input bg-muted/50 px-3 py-2 text-sm"
              >
                <span>{outcome}</span>
                <button
                  type="button"
                  onClick={() => removeOutcome(index)}
                  className="ms-2 text-muted-foreground hover:text-error transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Learning Outcomes (Arabic) */}
      <div className="space-y-3">
        <Label>Learning Outcomes (Arabic)</Label>
        <div className="flex gap-2">
          <Input
            dir="rtl"
            value={outcomeArInput}
            onChange={(e) => setOutcomeArInput(e.target.value)}
            placeholder="مخرجات التعلم بالعربية"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addOutcomeAr();
              }
            }}
          />
          <Button type="button" variant="outline" size="default" onClick={addOutcomeAr}>
            <Plus className="h-4 w-4 me-1" />
            Add
          </Button>
        </div>
        {learningOutcomesAr.length > 0 && (
          <ul className="space-y-2">
            {learningOutcomesAr.map((outcome, index) => (
              <li
                key={index}
                className="flex items-center justify-between rounded-md border border-input bg-muted/50 px-3 py-2 text-sm"
                dir="rtl"
              >
                <span>{outcome}</span>
                <button
                  type="button"
                  onClick={() => removeOutcomeAr(index)}
                  className="ms-2 text-muted-foreground hover:text-error transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Tags */}
      <div className="space-y-3">
        <Label>Tags</Label>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="e.g. finance, risk, banking"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
          />
          <Button type="button" variant="outline" size="default" onClick={addTag}>
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

      {/* Thumbnail Upload */}
      <div className="space-y-3">
        <Label>Thumbnail Image</Label>
        <div className="flex items-start gap-4">
          <label
            htmlFor="thumbnail-upload"
            className={cn(
              "flex h-32 w-48 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-input bg-muted/30 transition-colors hover:border-primary hover:bg-muted/50",
              thumbnailPreview && "border-solid border-primary"
            )}
          >
            {thumbnailPreview ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={thumbnailPreview}
                alt="Thumbnail preview"
                className="h-full w-full rounded-md object-cover"
              />
            ) : (
              <>
                <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Click to upload</span>
              </>
            )}
            <input
              id="thumbnail-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleThumbnailChange}
            />
          </label>
          {thumbnailPreview && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setThumbnailFile(null);
                setThumbnailPreview(null);
              }}
            >
              <X className="h-4 w-4 me-1" />
              Remove
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Recommended: 1280x720px, PNG or JPG, max 2MB
        </p>
      </div>
    </div>
  );

  // Step 3: Review & Publish
  const renderStep3 = () => {
    const selectedCategory = categories.find((c) => c.id === watchedValues.categoryId);
    const selectedInstructor = instructors.find((i) => i.id === watchedValues.instructorId);

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Course Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Basic Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <SummaryField label="Title" value={watchedValues.title} />
              <SummaryField label="Title (Arabic)" value={watchedValues.titleAr} />
              <SummaryField
                label="Short Description"
                value={watchedValues.shortDescription}
              />
              <SummaryField
                label="Short Description (Arabic)"
                value={watchedValues.shortDescriptionAr}
              />
            </div>

            <div className="border-t pt-4">
              <SummaryField label="Description" value={watchedValues.description} />
            </div>

            {watchedValues.descriptionAr && (
              <div className="border-t pt-4">
                <SummaryField
                  label="Description (Arabic)"
                  value={watchedValues.descriptionAr}
                />
              </div>
            )}

            <div className="grid gap-4 border-t pt-4 sm:grid-cols-2 lg:grid-cols-3">
              <SummaryField
                label="Category"
                value={
                  selectedCategory
                    ? locale === "ar"
                      ? selectedCategory.name_ar || selectedCategory.name
                      : selectedCategory.name
                    : "Not selected"
                }
              />
              <SummaryField
                label="Instructor"
                value={selectedInstructor?.full_name ?? "Not assigned"}
              />
              <SummaryField
                label="Difficulty"
                value={
                  watchedValues.difficultyLevel
                    ? watchedValues.difficultyLevel.charAt(0).toUpperCase() +
                      watchedValues.difficultyLevel.slice(1)
                    : ""
                }
              />
            </div>

            <div className="grid gap-4 border-t pt-4 sm:grid-cols-2 lg:grid-cols-3">
              <SummaryField
                label="Price"
                value={
                  watchedValues.isFree
                    ? "Free"
                    : `${watchedValues.price} ${watchedValues.currency}`
                }
              />
              <SummaryField
                label="Featured"
                value={watchedValues.isFeatured ? "Yes" : "No"}
              />
              <SummaryField
                label="Certificate"
                value={
                  watchedValues.certificateEnabled
                    ? `Enabled (Pass: ${watchedValues.passingScore}%)`
                    : "Disabled"
                }
              />
            </div>

            {learningOutcomes.length > 0 && (
              <div className="border-t pt-4">
                <p className="mb-2 text-sm font-medium text-muted-foreground">
                  Learning Outcomes
                </p>
                <ul className="list-inside list-disc space-y-1 text-sm">
                  {learningOutcomes.map((o, i) => (
                    <li key={i}>{o}</li>
                  ))}
                </ul>
              </div>
            )}

            {learningOutcomesAr.length > 0 && (
              <div className="border-t pt-4">
                <p className="mb-2 text-sm font-medium text-muted-foreground">
                  Learning Outcomes (Arabic)
                </p>
                <ul className="list-inside list-disc space-y-1 text-sm" dir="rtl">
                  {learningOutcomesAr.map((o, i) => (
                    <li key={i}>{o}</li>
                  ))}
                </ul>
              </div>
            )}

            {tags.length > 0 && (
              <div className="border-t pt-4">
                <p className="mb-2 text-sm font-medium text-muted-foreground">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {thumbnailPreview && (
              <div className="border-t pt-4">
                <p className="mb-2 text-sm font-medium text-muted-foreground">
                  Thumbnail
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumbnailPreview}
                  alt="Course thumbnail"
                  className="h-32 w-48 rounded-md object-cover"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {submitError && (
          <div className="rounded-md bg-error/10 px-4 py-3 text-sm text-error">
            {submitError}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={handleSubmit((data) => onSubmit(data, "draft"))}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin me-2" />
            ) : null}
            Save as Draft
          </Button>
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit((data) => onSubmit(data, "published"))}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin me-2" />
            ) : null}
            {mode === "edit" ? "Update & Publish" : "Publish Course"}
          </Button>
        </div>
      </div>
    );
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <StepIndicator />

      <Card>
        <CardHeader>
          <CardTitle>
            {mode === "edit" ? "Edit Course" : "Create New Course"} — {STEPS[step - 1].label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => e.preventDefault()}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}

            {/* Navigation buttons (steps 1 & 2) */}
            {step < 3 && (
              <div className="mt-8 flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goToPrevStep}
                  disabled={step === 1}
                >
                  <ChevronLeft className="h-4 w-4 me-1" />
                  Back
                </Button>
                <Button type="button" onClick={goToNextStep}>
                  Next
                  <ChevronRight className="h-4 w-4 ms-1" />
                </Button>
              </div>
            )}

            {/* Back button on step 3 */}
            {step === 3 && (
              <div className="mt-6">
                <Button type="button" variant="outline" onClick={goToPrevStep}>
                  <ChevronLeft className="h-4 w-4 me-1" />
                  Back to Settings
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper component for the review summary
function SummaryField({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm">{value || "—"}</p>
    </div>
  );
}
