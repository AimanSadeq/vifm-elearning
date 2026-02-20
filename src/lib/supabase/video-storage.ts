import { createClient } from "@supabase/supabase-js";

const BUCKET = "course-videos";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Sanitize a filename for safe storage.
 * Removes special characters, collapses whitespace, lowercases.
 */
export function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Build storage path: {courseId}/{timestamp}-{sanitizedFileName}
 */
function buildPath(courseId: string, fileName: string): string {
  const sanitized = sanitizeFileName(fileName);
  const ts = Date.now();
  return `${courseId}/${ts}-${sanitized}`;
}

/**
 * Upload a video file to the course-videos bucket.
 * Must be called from server-side (uses service role key).
 */
export async function uploadCourseVideo(
  courseId: string,
  fileName: string,
  file: Buffer | Blob,
  contentType: string
): Promise<{ path: string; error: string | null }> {
  const admin = getAdminClient();
  const path = buildPath(courseId, fileName);

  const { error } = await admin.storage
    .from(BUCKET)
    .upload(path, file, {
      contentType,
      upsert: false,
    });

  if (error) {
    return { path: "", error: error.message };
  }

  return { path, error: null };
}

/**
 * Delete a video file from the course-videos bucket.
 */
export async function deleteCourseVideo(
  path: string
): Promise<{ error: string | null }> {
  const admin = getAdminClient();

  const { error } = await admin.storage
    .from(BUCKET)
    .remove([path]);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Create a signed URL for a course video.
 */
export async function createCourseVideoSignedUrl(
  path: string,
  expiresInSeconds: number
): Promise<{ url: string | null; error: string | null }> {
  const admin = getAdminClient();

  const { data, error } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data) {
    return { url: null, error: error?.message ?? "Failed to create signed URL" };
  }

  return { url: data.signedUrl, error: null };
}
