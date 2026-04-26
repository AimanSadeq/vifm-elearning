import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z
  .object({
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    phone: z.string().optional(),
    preferredLanguage: z.enum(["en", "ar"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const profileSchema = z.object({
  fullName: z.string().min(2),
  fullNameAr: z.string().optional(),
  phone: z.string().optional(),
  preferredLanguage: z.enum(["en", "ar"]),
  timezone: z.string(),
});

export const courseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  titleAr: z.string().optional(),
  description: z.string().min(10),
  descriptionAr: z.string().optional(),
  shortDescription: z.string().max(200).optional(),
  shortDescriptionAr: z.string().max(200).optional(),
  categoryId: z.string().uuid(),
  instructorId: z.preprocess((val) => (val === "" ? undefined : val), z.string().uuid().optional()),
  difficultyLevel: z.enum(["beginner", "intermediate", "advanced", "expert"]),
  price: z.number().min(0),
  currency: z.string(),
  isFree: z.boolean(),
  isFeatured: z.boolean(),
  certificateEnabled: z.boolean(),
  certificateTemplateId: z.string().uuid().optional().or(z.literal("")),
  passingScore: z.number().min(0).max(100),
  learningOutcomes: z.array(z.string()).optional(),
  learningOutcomesAr: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

export const moduleSchema = z.object({
  title: z.string().min(2),
  titleAr: z.string().optional(),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  isPreview: z.boolean(),
});

export const lessonSchema = z.object({
  title: z.string().min(2),
  titleAr: z.string().optional(),
  contentType: z.enum(["video", "document", "quiz", "assignment"]),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  isPreview: z.boolean(),
  isMandatory: z.boolean(),
  durationMinutes: z.number().min(0).optional(),
});

export const quizSchema = z.object({
  title: z.string().min(2),
  titleAr: z.string().optional(),
  description: z.string().optional(),
  isFinalExam: z.boolean(),
  passingScore: z.number().min(0).max(100),
  timeLimitMinutes: z.number().min(1).nullable().optional(),
  maxAttempts: z.number().min(1),
  shuffleQuestions: z.boolean(),
  showCorrectAnswers: z.boolean(),
});

// Helper for `<input type="datetime-local">` which yields strings like
// "2026-04-25T10:30" — strict z.datetime() rejects those because it requires
// a timezone offset. Coerce to a real Date and back to ISO so downstream
// consumers always see a canonical timestamp; treat empty / invalid as undefined.
const datetimeLocalOptional = z
  .union([z.string(), z.literal("")])
  .optional()
  .transform((v) => {
    if (!v) return undefined;
    const d = new Date(v);
    return isNaN(d.getTime()) ? undefined : d.toISOString();
  });

// Number fields fed by `<input type="number" {...register(..., { valueAsNumber: true })}>`
// emit NaN when the input is blank. Treat NaN as undefined for optional fields.
const optionalPositiveNumber = z
  .union([z.number(), z.nan()])
  .optional()
  .transform((v) => (v === undefined || Number.isNaN(v) ? undefined : v))
  .refine((v) => v === undefined || v > 0, {
    message: "Must be a positive number",
  });

export const promoCodeSchema = z.object({
  code: z.string().min(3).max(20).toUpperCase(),
  description: z.string().optional(),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.number().positive(),
  currency: z.string(),
  maxUses: optionalPositiveNumber,
  minPurchaseAmount: z
    .union([z.number(), z.nan()])
    .transform((v) => (Number.isNaN(v) ? 0 : v))
    .pipe(z.number().min(0)),
  startsAt: datetimeLocalOptional,
  expiresAt: datetimeLocalOptional,
});

export const voucherSchema = z
  .object({
    code: z.string().min(3).max(30).toUpperCase(),
    description: z.string().optional(),
    voucherType: z.enum(["full_access", "percentage", "fixed_amount"]),
    discountValue: optionalPositiveNumber,
    currency: z.string().default("USD"),
    maxUses: optionalPositiveNumber,
    isSingleUse: z.boolean().default(true),
    applicableCourses: z.array(z.string().uuid()).optional(),
    startsAt: datetimeLocalOptional,
    expiresAt: datetimeLocalOptional,
  })
  .refine(
    (data) => {
      if (data.voucherType !== "full_access" && !data.discountValue) {
        return false;
      }
      return true;
    },
    {
      message: "Discount value is required for percentage and fixed amount vouchers",
      path: ["discountValue"],
    }
  )
  .refine(
    (data) => {
      if (data.voucherType === "percentage" && data.discountValue) {
        return data.discountValue >= 1 && data.discountValue <= 100;
      }
      return true;
    },
    {
      message: "Percentage must be between 1 and 100",
      path: ["discountValue"],
    }
  );

export const organizationSchema = z.object({
  name: z.string().min(2),
  nameAr: z.string().optional(),
  domain: z.string().optional(),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  licenseType: z.enum(["per_seat", "unlimited", "course_bundle"]),
  maxSeats: z.number().positive().optional(),
  licenseStartDate: z.string().optional(),
  licenseEndDate: z.string().optional(),
});

export const quizQuestionSchema = z.object({
  questionText: z.string().min(1, "Question text is required"),
  questionTextAr: z.string().optional(),
  questionType: z.enum([
    "multiple_choice",
    "true_false",
    "short_answer",
    "multi_select",
  ]),
  points: z.number().min(0).default(1),
  explanation: z.string().optional(),
  explanationAr: z.string().optional(),
  options: z
    .array(
      z.object({
        optionText: z.string().min(1),
        optionTextAr: z.string().optional(),
        isCorrect: z.boolean(),
      })
    )
    .optional(),
});

export const submitQuizSchema = z.object({
  quizId: z.string().uuid(),
  answers: z.array(
    z.object({
      questionId: z.string().uuid(),
      selectedOptionIds: z.array(z.string().uuid()).optional(),
      textAnswer: z.string().optional(),
    })
  ),
  timeSpentSeconds: z.number().min(0),
});

export const webinarSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  titleAr: z.string().optional(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  descriptionAr: z.string().optional(),
  instructorId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  scheduledAt: z.string().min(1, "Schedule date is required"),
  durationMinutes: z.number().min(15).max(480),
  maxAttendees: z.number().min(1).optional(),
  isFree: z.boolean(),
  price: z.number().min(0),
  currency: z.string(),
  tags: z.array(z.string()).optional(),
});

export const forumPostSchema = z.object({
  courseId: z.string().uuid(),
  lessonId: z.string().uuid().optional(),
  parentId: z.string().uuid().optional(),
  postType: z.enum(["question", "discussion", "announcement"]),
  title: z.string().min(3).optional(),
  titleAr: z.string().optional(),
  body: z.string().min(1, "Post body is required"),
  bodyAr: z.string().optional(),
});

export const notificationPreferencesSchema = z.object({
  emailNotifications: z.boolean(),
  webinarReminders: z.boolean(),
  courseUpdates: z.boolean(),
  marketingEmails: z.boolean(),
});

export const certificateTemplateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  nameAr: z.string().optional(),
  templateKey: z.enum(["classic", "modern", "corporate", "elegant"]),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  logoUrl: z.string().url().optional().or(z.literal("")),
  organizationName: z.string().min(1, "Organization name is required"),
  organizationNameAr: z.string().optional(),
  isDefault: z.boolean(),
  isActive: z.boolean(),
});

export const learningPathSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  titleAr: z.string().optional(),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  difficultyLevel: z.enum(["beginner", "intermediate", "advanced", "expert"]),
  categoryId: z.preprocess((val) => (val === "" ? undefined : val), z.string().uuid().optional()),
  estimatedHours: z.number().min(0),
  isPublished: z.boolean(),
  isFeatured: z.boolean(),
  sortOrder: z.number().min(0).default(0),
  courses: z
    .array(
      z.object({
        courseId: z.string().uuid(),
        sortOrder: z.number().min(0),
        isRequired: z.boolean(),
      })
    )
    .optional(),
});

export const subscriptionPlanSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  nameAr: z.string().optional(),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  planType: z.enum(["monthly", "quarterly", "annual", "lifetime"]),
  price: z.number().min(0),
  currency: z.string(),
  features: z.array(z.string()).optional(),
  featuresAr: z.array(z.string()).optional(),
  isActive: z.boolean(),
  sortOrder: z.number().min(0).default(0),
});

const userFormBase = {
  email: z.string().email("Invalid email address"),
  full_name: z.string().min(1, "Full name is required"),
  full_name_ar: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(["super_admin", "instructor", "corporate_admin", "learner"]),
  organization_id: z.string().uuid().optional().nullable(),
  language: z.enum(["en", "ar"]).default("en"),
  is_active: z.boolean().default(true),
};

export const userFormSchema = z.object({
  ...userFormBase,
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
});

export const userCreateSchema = z.object({
  ...userFormBase,
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const bulkImportSchema = z.object({
  users: z
    .array(
      z.object({
        email: z.string().email(),
        fullName: z.string().min(1),
        phone: z.string().optional(),
        jobTitle: z.string().optional(),
        company: z.string().optional(),
      })
    )
    .min(1)
    .max(500),
  courseIds: z.array(z.string().uuid()).min(1),
  accessExpiresAt: z.string().datetime(),
  voucherDescription: z.string().optional(),
});

export type BulkImportInput = z.infer<typeof bulkImportSchema>;

export type UserFormInput = z.infer<typeof userFormSchema>;
export type UserCreateInput = z.infer<typeof userCreateSchema>;

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type CourseInput = z.infer<typeof courseSchema>;
export type ModuleInput = z.infer<typeof moduleSchema>;
export type LessonInput = z.infer<typeof lessonSchema>;
export type QuizInput = z.infer<typeof quizSchema>;
export type QuizQuestionInput = z.infer<typeof quizQuestionSchema>;
export type SubmitQuizInput = z.infer<typeof submitQuizSchema>;
export type PromoCodeInput = z.infer<typeof promoCodeSchema>;
export type VoucherInput = z.infer<typeof voucherSchema>;
export type OrganizationInput = z.infer<typeof organizationSchema>;
export type WebinarInput = z.infer<typeof webinarSchema>;
export type ForumPostInput = z.infer<typeof forumPostSchema>;
export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>;
export type CertificateTemplateInput = z.infer<typeof certificateTemplateSchema>;
export type LearningPathInput = z.infer<typeof learningPathSchema>;
export type SubscriptionPlanInput = z.infer<typeof subscriptionPlanSchema>;
