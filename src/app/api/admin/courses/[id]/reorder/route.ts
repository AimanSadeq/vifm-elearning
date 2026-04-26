import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    const supabase = await createServerSupabase()

    // Verify auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['super_admin', 'instructor'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (profile.role === 'instructor') {
      const { data: course } = await supabase
        .from('courses')
        .select('instructor_id')
        .eq('id', courseId)
        .single()

      if (!course || course.instructor_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const { moduleId, lessonIds, moduleIds } = await request.json()

    if (Array.isArray(moduleIds) && moduleIds.length > 0) {
      const moduleUpdates = moduleIds.map((id: string, index: number) =>
        supabase
          .from('modules')
          .update({ sort_order: index })
          .eq('id', id)
          .eq('course_id', courseId)
      )

      const results = await Promise.all(moduleUpdates)
      const failed = results.filter((r: { error: unknown }) => r.error)

      if (failed.length > 0) {
        console.error('Some module reorder updates failed:', failed.map((f: { error: unknown }) => f.error))
        return NextResponse.json(
          { error: 'Some updates failed' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true })
    }

    if (!moduleId || !Array.isArray(lessonIds) || lessonIds.length === 0) {
      return NextResponse.json(
        { error: 'moduleId and lessonIds array, or moduleIds array, are required' },
        { status: 400 }
      )
    }

    // Update sort_order for each lesson
    const updates = lessonIds.map((lessonId: string, index: number) =>
      supabase
        .from('lessons')
        .update({ sort_order: index })
        .eq('id', lessonId)
        .eq('module_id', moduleId)
        .eq('course_id', courseId)
    )

    const results = await Promise.all(updates)
    const failed = results.filter((r: { error: unknown }) => r.error)

    if (failed.length > 0) {
      console.error('Some reorder updates failed:', failed.map((f: { error: unknown }) => f.error))
      return NextResponse.json(
        { error: 'Some updates failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reorder error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
