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
  instructorId: z.string().uuid().optional(),
  difficultyLevel: z.enum(["beginner", "intermediate", "advanced", "expert"]),
  price: z.number().min(0),
  currency: z.string(),
  isFree: z.boolean(),
  isFeatured: z.boolean(),
  certificateEnabled: z.boolean(),
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

export const promoCodeSchema = z.object({
  code: z.string().min(3).max(20).toUpperCase(),
  description: z.string().optional(),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.number().positive(),
  currency: z.string(),
  maxUses: z.number().positive().optional(),
  minPurchaseAmount: z.number().min(0),
  startsAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
});

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
export type OrganizationInput = z.infer<typeof organizationSchema>;
export type WebinarInput = z.infer<typeof webinarSchema>;
export type ForumPostInput = z.infer<typeof forumPostSchema>;
export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>;
