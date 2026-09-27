import type { Lesson, Module } from '@/types'

export type ModuleWithLessons = Module & { lessons: Lesson[] }

/**
 * Browser-side curriculum read: modules with their lessons, both sorted by
 * sort_order.
 *
 * `lessons` is no longer SELECT-able by anon/authenticated, and a PostgREST
 * `modules` + `lessons(*)` embed needs that privilege, so the direct query
 * fails with 42501. Published courses go through the public route, which
 * NULLs lesson media unless the caller is entitled (or the lesson is a
 * preview). Unpublished courses are only visible to staff, through the admin
 * route. Returns null when the read fails.
 */
export async function fetchCurriculum(course: {
  id: string
  status?: string | null
}): Promise<ModuleWithLessons[] | null> {
  const isPublished = course.status === 'published'
  try {
    const res = await fetch(
      isPublished
        ? `/api/public/courses/${course.id}/curriculum`
        : `/api/admin/courses/${course.id}/curriculum`
    )
    if (!res.ok) {
      console.error('Failed to load curriculum', res.status)
      return null
    }
    const json = await res.json()
    return ((isPublished ? json?.data : json?.modules) ?? null) as ModuleWithLessons[] | null
  } catch (err) {
    console.error('Failed to load curriculum', err)
    return null
  }
}
