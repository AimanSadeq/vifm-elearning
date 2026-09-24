import { createClient } from '@/lib/supabase/client'

/**
 * Browser-side calls to /api/admin/lessons/*.
 *
 * `authenticated` can no longer write the `lessons` table directly, so the
 * admin console creates, edits and deletes lessons through these routes. They
 * authenticate with the session's access token, like the reorder route.
 */
async function adminLessonsFetch(path: string, init: { method: string; body?: unknown }) {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Not authenticated')

  const res = await fetch(path, {
    method: init.method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(json?.error ?? `Request failed (${res.status})`)
  }
  return json
}

export function createLesson(data: Record<string, unknown>): Promise<{ id: string }> {
  return adminLessonsFetch('/api/admin/lessons', { method: 'POST', body: data })
}

export function updateLesson(lessonId: string, data: Record<string, unknown>) {
  return adminLessonsFetch(`/api/admin/lessons/${lessonId}`, { method: 'PATCH', body: data })
}

export function deleteLesson(lessonId: string) {
  return adminLessonsFetch(`/api/admin/lessons/${lessonId}`, { method: 'DELETE' })
}

export function deleteLessons(ids: string[]) {
  return adminLessonsFetch('/api/admin/lessons', { method: 'DELETE', body: { ids } })
}

/** Saves an uploaded video's storage path (validated server-side). */
export function setLessonVideo(lessonId: string, videoUrl: string, durationSeconds?: number | null) {
  return adminLessonsFetch(`/api/admin/lessons/${lessonId}/video-url`, {
    method: 'PATCH',
    // The route validates duration as a positive int, so omit it rather than
    // sending null when the browser could not read one.
    body: {
      video_url: videoUrl,
      ...(durationSeconds ? { video_duration_seconds: Math.round(durationSeconds) } : {}),
    },
  })
}
