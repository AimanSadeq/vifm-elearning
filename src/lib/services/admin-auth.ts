import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type AdminRole = "super_admin" | "instructor";

export interface AuthorizedAdmin {
  userId: string;
  role: AdminRole;
}

export interface AdminAuthError {
  error: string;
  status: 401 | 403;
}

/**
 * Verifies a Bearer token and returns the user's admin role.
 * Used by admin API routes that operate via supabaseAdmin (bypassing RLS).
 */
export async function authorizeAdmin(
  request: NextRequest
): Promise<{ ok: true; admin: AuthorizedAdmin } | { ok: false; error: AdminAuthError }> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return { ok: false, error: { error: "Unauthorized", status: 401 } };
  }

  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    return { ok: false, error: { error: "Unauthorized", status: 401 } };
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !["super_admin", "instructor"].includes(profile.role)) {
    return { ok: false, error: { error: "Forbidden", status: 403 } };
  }

  return {
    ok: true,
    admin: { userId: user.id, role: profile.role as AdminRole },
  };
}

/**
 * Confirms the admin owns the course (or is super_admin).
 * Returns true if authorized; false if the course doesn't exist or belongs to another instructor.
 */
export async function adminOwnsCourse(
  admin: AuthorizedAdmin,
  courseId: string
): Promise<boolean> {
  if (admin.role === "super_admin") return true;

  const { data: course } = await supabaseAdmin
    .from("courses")
    .select("instructor_id")
    .eq("id", courseId)
    .maybeSingle();

  return !!course && course.instructor_id === admin.userId;
}

/**
 * Confirms the admin owns the lesson's parent course (or is super_admin).
 */
export async function adminOwnsLesson(
  admin: AuthorizedAdmin,
  lessonId: string
): Promise<boolean> {
  if (admin.role === "super_admin") return true;

  const { data: lesson } = await supabaseAdmin
    .from("lessons")
    .select("course_id")
    .eq("id", lessonId)
    .maybeSingle();

  if (!lesson?.course_id) return false;
  return adminOwnsCourse(admin, lesson.course_id);
}
