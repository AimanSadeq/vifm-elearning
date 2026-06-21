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
  "gateway",
  "professional",
  "executive",
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
export const VIDEO_COMPLETION_THRESHOLD = 0.9; // 90% — fallback when per-lesson config is not set
export const SIGNED_URL_EXPIRY = 7200; // 2 hours in seconds
export const VIDEO_MAX_RESTRICTED_SPEED = 1.5; // Max speed for restricted courses
export const VIDEO_AUTOPLAY_COUNTDOWN_SECONDS = 5;
export const PROGRESS_QUEUE_KEY = "vifm_progress_retry_queue";

// Watched segments: divides video into N equal segments for granular completion tracking
export const WATCHED_SEGMENTS_COUNT = 100;

// Per-lesson video config defaults (overridden by lesson-level DB values)
export const VIDEO_DEFAULT_MINIMUM_WATCH_PERCENTAGE = 90;
export const VIDEO_DEFAULT_AUTO_SAVE_INTERVAL_SECONDS = 30;
export const VIDEO_DEFAULT_ALLOW_SPEED_CONTROL = true;
export const VIDEO_DEFAULT_ALLOW_DOWNLOAD = false;
export const VIDEO_DEFAULT_ALLOW_SKIPPING = true;
export const VIDEO_DEFAULT_FORCE_WATCH_FIRST = false;

export const VIDEO_BOOKMARK_COLORS = {
  yellow: "#facc15",
  blue: "#60a5fa",
  green: "#4ade80",
  pink: "#f472b6",
  orange: "#fb923c",
} as const;

export const VIDEO_QUALITY_LABELS: Record<number, string> = {
  2160: "4K",
  1440: "1440p",
  1080: "1080p",
  720: "720p",
  480: "480p",
  360: "360p",
  240: "240p",
};

export const DEFAULT_PASSING_SCORE = 70;
export const DEFAULT_MAX_QUIZ_ATTEMPTS = 3;
