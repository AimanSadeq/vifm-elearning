import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sanitizeFileName } from '@/lib/supabase/video-storage'

const VIDEO_BUCKET = 'course-videos'
const DOCUMENT_BUCKET = 'course-assets'

const VIDEO_MIMES = ['video/mp4', 'video/webm', 'video/quicktime']
const PDF_MIMES = ['application/pdf']
const ZIP_MIMES = [
  'application/zip',
  'application/x-zip-compressed',
  'application/x-zip',
  'multipart/x-zip',
  'application/octet-stream', // some browsers send this for .zip
]

const VIDEO_MAX = 2 * 1024 * 1024 * 1024 // 2 GB
const PDF_MAX = 100 * 1024 * 1024 // 100 MB
const ZIP_MAX = 500 * 1024 * 1024 // 500 MB

interface UploadUrlRequest {
  kind: 'video' | 'document'
  fileName: string
  fileSize: number
  mimeType: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
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

    const body = (await request.json()) as UploadUrlRequest
    const { kind, fileName, fileSize, mimeType } = body

    if (!kind || !fileName || typeof fileSize !== 'number') {
      return NextResponse.json(
        { error: 'kind, fileName, and fileSize are required' },
        { status: 400 }
      )
    }

    let bucket: string
    let path: string
    let documentType: 'pdf' | 'zip' | undefined

    if (kind === 'video') {
      if (!VIDEO_MIMES.includes(mimeType)) {
        return NextResponse.json(
          { error: 'Only MP4, WebM, or MOV videos are allowed' },
          { status: 400 }
        )
      }
      if (fileSize > VIDEO_MAX) {
        return NextResponse.json(
          { error: 'Video too large. Maximum size is 2 GB.' },
          { status: 413 }
        )
      }
      bucket = VIDEO_BUCKET
      path = `${courseId}/${Date.now()}-${sanitizeFileName(fileName)}`
    } else if (kind === 'document') {
      const lower = fileName.toLowerCase()
      const isZip = ZIP_MIMES.includes(mimeType) || lower.endsWith('.zip')
      const isPdf = PDF_MIMES.includes(mimeType) || lower.endsWith('.pdf')

      if (!isZip && !isPdf) {
        return NextResponse.json(
          { error: 'Only PDF or ZIP files are allowed' },
          { status: 400 }
        )
      }

      // Prefer ZIP when both match (e.g. octet-stream + .zip extension)
      documentType = isZip ? 'zip' : 'pdf'
      const maxBytes = documentType === 'zip' ? ZIP_MAX : PDF_MAX

      if (fileSize > maxBytes) {
        const limit = documentType === 'zip' ? '500 MB' : '100 MB'
        return NextResponse.json(
          { error: `File too large. Maximum size for ${documentType.toUpperCase()} is ${limit}.` },
          { status: 413 }
        )
      }

      bucket = DOCUMENT_BUCKET
      path = `courses/${courseId}/documents/${Date.now()}-${sanitizeFileName(fileName)}`
    } else {
      return NextResponse.json({ error: 'Invalid kind' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUploadUrl(path)

    if (error || !data) {
      return NextResponse.json(
        { error: `Failed to create upload URL: ${error?.message || 'unknown'}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      bucket,
      path,
      signedUrl: data.signedUrl,
      token: data.token,
      documentType,
    })
  } catch (error) {
    console.error('Upload-url error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
