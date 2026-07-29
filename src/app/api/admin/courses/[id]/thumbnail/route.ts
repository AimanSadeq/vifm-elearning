import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase/server'

import { getOwnRole } from '@/lib/supabase/own-profile'
import { supabaseAdmin } from '@/lib/supabase/admin'
const BUCKET = 'course-assets'
const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']

async function authorize(courseId: string) {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  // Own role — read via my_profile; `profiles.role` is not granted
  // to `authenticated` any more.
  const profile = { role: await getOwnRole(supabase) }

  if (!profile.role || !['super_admin', 'instructor'].includes(profile.role)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  if (profile.role === 'instructor') {
    const { data: course } = await supabase
      .from('courses')
      .select('instructor_id')
      .eq('id', courseId)
      .single()
    if (!course || course.instructor_id !== user.id) {
      return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
    }
  }

  return { user }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params

    const auth = await authorize(courseId)
    if ('error' in auth) return auth.error

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (!ALLOWED_MIMES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only JPG, PNG, or WebP images are allowed' },
        { status: 400 }
      )
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Image must be less than 5MB' }, { status: 413 })
    }

    const fileExt = (file.name.split('.').pop() || 'jpg').toLowerCase()
    const filePath = `courses/${courseId}/thumbnail.${fileExt}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(filePath, buffer, { upsert: true, contentType: file.type })

    if (uploadError) {
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      )
    }

    const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filePath)

    // Cache-bust on every replace. The Storage path stays stable (we
    // overwrite the same `thumbnail.<ext>` to keep cleanup simple), so
    // without a query param browsers + the Supabase CDN serve the old
    // image after replace. Pin the bust value to upload time.
    const cacheBustedUrl = `${urlData.publicUrl}?v=${Date.now()}`

    const { error: updateError } = await supabaseAdmin
      .from('courses')
      .update({ thumbnail_url: cacheBustedUrl })
      .eq('id', courseId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Catalog cards show this thumbnail; bust the SSR cache.
    revalidateTag('courses')

    return NextResponse.json({ thumbnail_url: cacheBustedUrl })
  } catch (err) {
    console.error('Thumbnail upload error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params

    const auth = await authorize(courseId)
    if ('error' in auth) return auth.error

    const { data: files } = await supabaseAdmin.storage
      .from(BUCKET)
      .list(`courses/${courseId}`)

    if (files) {
      const thumbnails = files.filter((f) => f.name.startsWith('thumbnail'))
      if (thumbnails.length > 0) {
        await supabaseAdmin.storage
          .from(BUCKET)
          .remove(thumbnails.map((f) => `courses/${courseId}/${f.name}`))
      }
    }

    const { error } = await supabaseAdmin
      .from('courses')
      .update({ thumbnail_url: null })
      .eq('id', courseId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    revalidateTag('courses')

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Thumbnail remove error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
