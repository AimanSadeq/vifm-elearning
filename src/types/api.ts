export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateCheckoutRequest {
  courseId: string;
  promoCode?: string;
  paymentMethod: "stripe" | "paytabs";
}

export interface CreateCheckoutResponse {
  url: string;
  sessionId: string;
}

export interface ValidatePromoRequest {
  code: string;
  courseId: string;
}

export interface ValidatePromoResponse {
  valid: boolean;
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  finalPrice?: number;
}

export interface SignedUrlRequest {
  lessonId: string;
  courseId: string;
}

export interface SignedUrlResponse {
  url: string;
  expiresAt: string;
}

export interface RecommendationsResponse {
  courses: Array<{
    courseId: string;
    reasoning: string;
  }>;
}

export interface DashboardAnalytics {
  totalRevenue: number;
  revenueChange: number;
  totalUsers: number;
  usersChange: number;
  totalEnrollments: number;
  enrollmentsChange: number;
  averageCompletion: number;
  completionChange: number;
}
