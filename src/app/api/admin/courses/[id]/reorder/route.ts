import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { authorizeAdmin, adminOwnsCourse } from '@/lib/services/admin-auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params

    const auth = await authorizeAdmin(request)
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
    }

    if (!(await adminOwnsCourse(auth.admin, courseId))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { moduleId, lessonIds, moduleIds } = await request.json()

    if (Array.isArray(moduleIds) && moduleIds.length > 0) {
      const moduleUpdates = moduleIds.map((id: string, index: number) =>
        supabaseAdmin
          .from('modules')
          .update({ sort_order: index })
          .eq('id', id)
          .eq('course_id', courseId)
      )

      const results = await Promise.all(moduleUpdates)
      const failed = results.filter((r: { error: unknown }) => r.error)

      if (failed.length > 0) {
        console.error(
          'Some module reorder updates failed:',
          failed.map((f: { error: unknown }) => f.error)
        )
        return NextResponse.json({ error: 'Some updates failed' }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    if (!moduleId || !Array.isArray(lessonIds) || lessonIds.length === 0) {
      return NextResponse.json(
        { error: 'moduleId and lessonIds array, or moduleIds array, are required' },
        { status: 400 }
      )
    }

    // Scope every update by both module_id and course_id so a malformed payload
    // can't reorder lessons across courses.
    const updates = lessonIds.map((lessonId: string, index: number) =>
      supabaseAdmin
        .from('lessons')
        .update({ sort_order: index })
        .eq('id', lessonId)
        .eq('module_id', moduleId)
        .eq('course_id', courseId)
    )

    const results = await Promise.all(updates)
    const failed = results.filter((r: { error: unknown }) => r.error)

    if (failed.length > 0) {
      console.error(
        'Some reorder updates failed:',
        failed.map((f: { error: unknown }) => f.error)
      )
      return NextResponse.json({ error: 'Some updates failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reorder error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
