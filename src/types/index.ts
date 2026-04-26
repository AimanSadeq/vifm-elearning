export type UserRole =
  | "super_admin"
  | "instructor"
  | "corporate_admin"
  | "learner";
export type CourseStatus = "draft" | "published" | "archived";
export type EnrollmentStatus = "active" | "completed" | "expired" | "suspended";
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";
export type PaymentMethod =
  | "stripe"
  | "paytabs"
  | "bank_transfer"
  | "promo_code"
  | "corporate_license"
  | "voucher";
export type VoucherType = "full_access" | "percentage" | "fixed_amount";
export type ContentType = "video" | "document" | "quiz" | "assignment";
export type QuestionType =
  | "multiple_choice"
  | "true_false"
  | "short_answer"
  | "multi_select";
export type NotificationChannel = "email" | "whatsapp" | "in_app";
export type WebinarStatus = "scheduled" | "live" | "completed" | "cancelled";
export type ForumPostType = "question" | "discussion" | "announcement";
export type SubscriptionPlan =
  | "monthly"
  | "quarterly"
  | "annual"
  | "lifetime";
export type CertificateStatus = "issued" | "revoked" | "expired";
export type CertificateTemplateKey = "classic" | "modern" | "corporate" | "elegant";
export type SubscriptionStatus = "active" | "cancelled" | "expired" | "past_due";
export type LearningPathStatus = "active" | "completed" | "dropped";
export type DifficultyLevel =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "expert";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  full_name_ar?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
  role: UserRole;
  organization_id?: string | null;
  language: "en" | "ar";
  timezone: string;
  is_active: boolean;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  name_ar?: string | null;
  logo_url?: string | null;
  domain?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  address?: string | null;
  license_type?: string | null;
  max_seats?: number | null;
  license_start_date?: string | null;
  license_end_date?: string | null;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  name_ar: string;
  slug: string;
  description?: string | null;
  description_ar?: string | null;
  icon?: string | null;
  color?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Course {
  id: string;
  title: string;
  title_ar?: string | null;
  slug: string;
  description?: string | null;
  description_ar?: string | null;
  short_description?: string | null;
  short_description_ar?: string | null;
  thumbnail_url?: string | null;
  preview_video_url?: string | null;
  category_id: string;
  instructor_id?: string | null;
  status: CourseStatus;
  difficulty_level?: DifficultyLevel | null;
  duration_hours?: number | null;
  price: number;
  currency: string;
  is_featured: boolean;
  is_free: boolean;
  prerequisites?: string[] | null;
  learning_outcomes?: string[] | null;
  learning_outcomes_ar?: string[] | null;
  tags?: string[] | null;
  max_enrollment?: number | null;
  enrollment_count: number;
  average_rating: number;
  rating_count: number;
  completion_rate: number;
  certificate_enabled: boolean;
  certificate_template_id?: string | null;
  designation_id?: string | null;
  sequential_locking_enabled: boolean;
  passing_score: number;
  metadata: Record<string, unknown>;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  category?: Category;
  instructor?: Pick<Profile, "full_name" | "full_name_ar" | "avatar_url">;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  title_ar?: string | null;
  description?: string | null;
  description_ar?: string | null;
  sort_order: number;
  is_preview: boolean;
  duration_minutes: number;
  created_at: string;
  updated_at: string;
  // Relations
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  module_id: string;
  course_id: string;
  title: string;
  title_ar?: string | null;
  description?: string | null;
  description_ar?: string | null;
  content_type: ContentType;
  sort_order: number;
  duration_minutes: number;
  is_preview: boolean;
  is_mandatory: boolean;
  video_url?: string | null;
  video_hls_url?: string | null;
  video_duration_seconds?: number | null;
  video_thumbnail_url?: string | null;
  captions_en_url?: string | null;
  captions_ar_url?: string | null;
  document_url?: string | null;
  document_type?: string | null;
  content_html?: string | null;
  content_html_ar?: string | null;
  // Per-lesson video config
  force_watch_first?: boolean;
  allow_speed_control?: boolean;
  allow_download?: boolean;
  minimum_watch_percentage?: number;
  allow_skipping?: boolean;
  auto_save_interval_seconds?: number;
  is_active?: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  organization_id?: string | null;
  status: EnrollmentStatus;
  enrolled_at: string;
  started_at?: string | null;
  completed_at?: string | null;
  expires_at?: string | null;
  progress_percentage: number;
  last_accessed_at?: string | null;
  last_lesson_id?: string | null;
  payment_id?: string | null;
  completed_lesson_ids?: string[];
  total_lesson_items?: number;
  completed_lesson_items?: number;
  total_time_spent_seconds?: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Relations
  course?: Course;
}

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  course_id: string;
  is_completed: boolean;
  progress_seconds: number;
  total_watch_time_seconds: number;
  max_progress_seconds: number;
  view_count?: number;
  video_completed?: boolean;
  first_viewed_at?: string | null;
  watched_segments?: boolean[];
  total_watch_time_delta_accumulated?: number;
  completed_at?: string | null;
  last_accessed_at: string;
  created_at: string;
  updated_at: string;
}

export type BookmarkType = "note" | "highlight" | "question" | "important";
export type BookmarkColor = "yellow" | "blue" | "green" | "pink" | "orange";

export interface Bookmark {
  id: string;
  user_id: string;
  lesson_id: string;
  course_id: string;
  timestamp_seconds: number;
  note?: string | null;
  title?: string | null;
  page_number?: number | null;
  bookmark_type: BookmarkType;
  color: BookmarkColor;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface VideoConfig {
  minimumWatchPercentage: number;
  allowSpeedControl: boolean;
  allowDownload: boolean;
  allowSkipping: boolean;
  autoSaveIntervalSeconds: number;
  forceWatchFirst: boolean;
  isFirstWatch: boolean;
}

export interface WatchStatistic {
  id: string;
  user_id: string;
  lesson_id: string;
  course_id: string;
  total_watch_time_seconds: number;
  play_count: number;
  pause_count: number;
  seek_count: number;
  created_at: string;
  updated_at: string;
}

export interface Quiz {
  id: string;
  lesson_id?: string | null;
  course_id: string;
  title: string;
  title_ar?: string | null;
  description?: string | null;
  description_ar?: string | null;
  is_final_exam: boolean;
  is_published: boolean;
  passing_score: number;
  time_limit_minutes?: number | null;
  max_attempts: number;
  shuffle_questions: boolean;
  show_correct_answers: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // Relations
  questions?: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_type: QuestionType;
  question_text: string;
  question_text_ar?: string | null;
  explanation?: string | null;
  explanation_ar?: string | null;
  points: number;
  sort_order: number;
  metadata: Record<string, unknown>;
  created_at: string;
  // Relations
  options?: QuizOption[];
}

export interface QuizOption {
  id: string;
  question_id: string;
  option_text: string;
  option_text_ar?: string | null;
  is_correct: boolean;
  sort_order: number;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  score?: number | null;
  total_points?: number | null;
  percentage?: number | null;
  passed?: boolean | null;
  time_taken_seconds?: number | null;
  attempt_number?: number | null;
  answers: unknown[];
  started_at: string;
  completed_at?: string | null;
  created_at: string;
}

export interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  enrollment_id?: string | null;
  certificate_number: string;
  verification_code: string;
  verification_url?: string | null;
  pdf_url?: string | null;
  status: CertificateStatus;
  issued_at: string;
  expires_at?: string | null;
  revoked_at?: string | null;
  revoke_reason?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  // Relations
  course?: Course;
  user?: Pick<Profile, "full_name" | "full_name_ar">;
}

export interface Payment {
  id: string;
  user_id: string;
  course_id?: string | null;
  organization_id?: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: PaymentMethod;
  /** "course_purchase" | "subscription" — distinguishes course vs sub payments */
  payment_type?: "course_purchase" | "subscription" | null;
  stripe_payment_intent_id?: string | null;
  stripe_session_id?: string | null;
  paytabs_transaction_ref?: string | null;
  bank_reference?: string | null;
  promo_code_id?: string | null;
  discount_amount: number;
  invoice_number?: string | null;
  invoice_url?: string | null;
  metadata: Record<string, unknown>;
  paid_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Webinar {
  id: string;
  title: string;
  title_ar?: string | null;
  description?: string | null;
  description_ar?: string | null;
  thumbnail_url?: string | null;
  instructor_id?: string | null;
  category_id?: string | null;
  status: WebinarStatus;
  meeting_url?: string | null;
  meeting_id?: string | null;
  scheduled_at: string;
  duration_minutes: number;
  /**
   * Recording URLs no longer live on the webinars row; they're fetched
   * through `/api/webinars/[id]/recording` after a plan-feature check.
   * The flag below stays on this row for "recording available" badges.
   */
  is_recording_public: boolean;
  max_attendees?: number | null;
  is_free: boolean;
  price: number;
  currency: string;
  tags?: string[] | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Relations
  instructor?: Pick<Profile, "full_name" | "full_name_ar" | "avatar_url">;
  category?: Category;
}

export interface Notification {
  id: string;
  user_id: string;
  channel: NotificationChannel;
  status: string;
  title: string;
  title_ar?: string | null;
  body: string;
  body_ar?: string | null;
  action_url?: string | null;
  metadata: Record<string, unknown>;
  read_at?: string | null;
  sent_at?: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  course_id: string;
  rating: number;
  review_text?: string | null;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  user?: Pick<Profile, "full_name" | "full_name_ar" | "avatar_url">;
}

export interface ForumPost {
  id: string;
  course_id: string;
  lesson_id?: string | null;
  author_id: string;
  parent_id?: string | null;
  post_type: ForumPostType;
  title?: string | null;
  title_ar?: string | null;
  body: string;
  body_ar?: string | null;
  is_pinned: boolean;
  is_resolved: boolean;
  is_instructor_answer: boolean;
  upvotes: number;
  downvotes: number;
  reply_count: number;
  created_at: string;
  updated_at: string;
  // Relations
  author?: Pick<Profile, "full_name" | "full_name_ar" | "avatar_url">;
  replies?: ForumPost[];
}

export interface Voucher {
  id: string;
  code: string;
  description?: string | null;
  voucher_type: VoucherType;
  discount_value?: number | null;
  currency: string;
  max_uses?: number | null;
  current_uses: number;
  applicable_courses: string[];
  is_single_use: boolean;
  is_active: boolean;
  starts_at?: string | null;
  expires_at?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface VoucherRedemption {
  id: string;
  voucher_id: string;
  user_id: string;
  course_id?: string | null;
  payment_id?: string | null;
  redeemed_at: string;
  // Relations
  voucher?: Voucher;
  course?: Course;
  user?: Pick<Profile, "full_name" | "full_name_ar">;
}

// ---------------------------------------------------------------------------
// Certificate Templates
// ---------------------------------------------------------------------------
export interface CertificateTemplate {
  id: string;
  name: string;
  name_ar?: string | null;
  template_key: CertificateTemplateKey;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  logo_url?: string | null;
  organization_name: string;
  organization_name_ar?: string | null;
  is_default: boolean;
  is_active: boolean;
  created_by?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Learning Paths
// ---------------------------------------------------------------------------
export interface LearningPath {
  id: string;
  title: string;
  title_ar?: string | null;
  description?: string | null;
  description_ar?: string | null;
  slug: string;
  thumbnail_url?: string | null;
  difficulty_level?: DifficultyLevel | null;
  category_id?: string | null;
  estimated_hours: number;
  is_published: boolean;
  is_featured: boolean;
  sort_order: number;
  enrollment_count: number;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  category?: Category;
  courses?: LearningPathCourse[];
}

export interface LearningPathCourse {
  id: string;
  learning_path_id: string;
  course_id: string;
  sort_order: number;
  is_required: boolean;
  created_at: string;
  // Relations
  course?: Course;
}

export interface LearningPathEnrollment {
  id: string;
  learning_path_id: string;
  user_id: string;
  status: LearningPathStatus;
  progress: number;
  enrolled_at: string;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  learning_path?: LearningPath;
}

// ---------------------------------------------------------------------------
// Subscription Plans
// ---------------------------------------------------------------------------
export interface SubscriptionPlanConfig {
  id: string;
  name: string;
  name_ar?: string | null;
  description?: string | null;
  description_ar?: string | null;
  plan_type: SubscriptionPlan;
  price: number;
  currency: string;
  features: string[];
  features_ar?: string[];
  stripe_product_id?: string | null;
  stripe_price_id?: string | null;
  is_active: boolean;
  sort_order: number;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Designations (Certifications)
// ---------------------------------------------------------------------------
export type DesignationTierLevel = "gateway" | "professional" | "executive";
export type DesignationHolderStatus = "active" | "grace_period" | "suspended" | "lapsed" | "revoked";

export interface Designation {
  id: string;
  name: string;
  name_ar: string | null;
  abbreviation: string;
  slug: string;
  description: string | null;
  description_ar: string | null;
  logo_url: string | null;
  body_of_knowledge: string | null;
  annual_cpe_required: number;
  renewal_fee: number;
  founding_fee: number;
  late_fee: number;
  reinstatement_fee: number;
  currency: string;
  renewal_month: number;
  renewal_day: number;
  grace_period_months: number;
  is_active: boolean;
  metadata: {
    tier_level?: DesignationTierLevel;
    exam_type?: string;
    pass_rate?: number;
    free_attempts?: number;
    cpe_cycle_years?: number;
    cpe_cycle_hours?: number;
    prerequisites?: string[];
  } | null;
  created_at: string;
  updated_at: string;
}

export interface DesignationTier {
  id: string;
  designation_id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  slug: string;
  annual_max_hours: number | null;
  hour_rate: number | null;
  requires_approval: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CPECategory {
  id: string;
  designation_id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  annual_max_hours: number | null;
  hour_rate: number | null;
  requires_approval: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DesignationDocument {
  id: string;
  designation_id: string;
  title: string;
  title_ar: string | null;
  description: string | null;
  description_ar: string | null;
  file_url: string | null;
  file_type: string | null;
  file_size_bytes: number | null;
  access_level: string;
  required_tier_id: string | null;
  sort_order: number;
  download_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type DesignationResourceType = "presentation" | "exercise" | "workshop";

export interface DesignationResource {
  id: string;
  designation_id: string;
  title: string;
  title_ar: string | null;
  description: string | null;
  description_ar: string | null;
  resource_type: DesignationResourceType;
  file_url: string | null;
  file_type: string | null;
  file_size_bytes: number | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  price: number;
  currency: string;
  stripe_subscription_id?: string | null;
  stripe_customer_id?: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end: boolean;
  cancelled_at?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Relations
  user?: Pick<Profile, "full_name" | "full_name_ar" | "email">;
}
