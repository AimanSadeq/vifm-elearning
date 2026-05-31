import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sanitizeFileName } from '@/lib/supabase/video-storage'
import { isUuid } from '@/lib/utils/uuid'

const BUCKET = 'course-assets'

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

/**
 * Uploads an image attached to a quiz question and returns its public URL.
 * Mirrors the course-thumbnail upload flow: small images are streamed through
 * the server straight into the public `course-assets` bucket. The returned URL
 * is stored in quiz_questions.image_url and rendered below the question text.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    if (!isUuid(courseId)) {
      return NextResponse.json({ error: 'Invalid course id' }, { status: 400 })
    }

    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!IMAGE_MIMES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only JPEG, PNG, WebP, or GIF images are allowed' },
        { status: 400 }
      )
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: 'Image too large. Maximum size is 5 MB.' },
        { status: 413 }
      )
    }

    // Unique path per upload so replacing an image never collides with an old one.
    const filePath = `courses/${courseId}/quiz-images/${Date.now()}-${sanitizeFileName(file.name)}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      })

    if (uploadError) {
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      )
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(filePath)

    return NextResponse.json({ url: urlData.publicUrl })
  } catch (error) {
    console.error('Quiz image upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
