export const APP_NAME = "VIFM Academy";

export const LOCALES = ["en", "ar"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const USER_ROLES = [
  "super_admin",
  "instructor",
  "corporate_admin",
  "learner",
] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const COURSE_STATUSES = ["draft", "published", "archived"] as const;
export type CourseStatus = (typeof COURSE_STATUSES)[number];

export const DIFFICULTY_LEVELS = [
  "beginner",
  "intermediate",
  "advanced",
  "expert",
] as const;
export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];

export const CONTENT_TYPES = [
  "video",
  "document",
  "quiz",
  "assignment",
] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export const CATEGORIES = [
  {
    name: "Finance & Banking",
    nameAr: "المالية والمصرفية",
    slug: "finance-banking",
    icon: "landmark",
    color: "#1E3A5F",
  },
  {
    name: "Data Analytics & AI",
    nameAr: "تحليل البيانات والذكاء الاصطناعي",
    slug: "data-analytics-ai",
    icon: "brain-circuit",
    color: "#2D6A4F",
  },
  {
    name: "Strategy & Leadership",
    nameAr: "الاستراتيجية والقيادة",
    slug: "strategy-leadership",
    icon: "target",
    color: "#7B2D8B",
  },
  {
    name: "Compliance & Risk Management",
    nameAr: "الامتثال وإدارة المخاطر",
    slug: "compliance-risk",
    icon: "shield-check",
    color: "#B85C38",
  },
] as const;

export const SIDEBAR_WIDTH = 280;
export const SIDEBAR_COLLAPSED_WIDTH = 80;

export const VIDEO_PROGRESS_INTERVAL = 30_000; // 30 seconds
export const VIDEO_COMPLETION_THRESHOLD = 0.9; // 90%
export const SIGNED_URL_EXPIRY = 7200; // 2 hours in seconds

export const DEFAULT_PASSING_SCORE = 70;
export const DEFAULT_MAX_QUIZ_ATTEMPTS = 3;
