import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sanitizeFileName } from '@/lib/supabase/video-storage'

const BUCKET = 'course-assets'

const PDF_MAX_BYTES = 100 * 1024 * 1024
const ZIP_MAX_BYTES = 500 * 1024 * 1024

const PDF_MIMES = ['application/pdf']
const ZIP_MIMES = [
  'application/zip',
  'application/x-zip-compressed',
  'application/x-zip',
  'multipart/x-zip',
  'application/octet-stream', // some browsers send this for .zip
]

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

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 })
    }

    const fileName = file.name.toLowerCase()
    const isZip =
      ZIP_MIMES.includes(file.type) || fileName.endsWith('.zip')
    const isPdf =
      PDF_MIMES.includes(file.type) || fileName.endsWith('.pdf')

    if (!isZip && !isPdf) {
      return NextResponse.json(
        { error: 'Only PDF or ZIP files are allowed' },
        { status: 400 }
      )
    }

    // Prefer ZIP if ambiguous (e.g. octet-stream with .zip name)
    const documentType: 'pdf' | 'zip' = isZip ? 'zip' : 'pdf'
    const maxBytes = documentType === 'zip' ? ZIP_MAX_BYTES : PDF_MAX_BYTES

    if (file.size > maxBytes) {
      const limitLabel = documentType === 'zip' ? '500 MB' : '100 MB'
      return NextResponse.json(
        { error: `File too large. Maximum size for ${documentType.toUpperCase()} is ${limitLabel}.` },
        { status: 413 }
      )
    }

    const sanitized = sanitizeFileName(file.name)
    const path = `courses/${courseId}/documents/${Date.now()}-${sanitized}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: file.type || (documentType === 'zip' ? 'application/zip' : 'application/pdf'),
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      )
    }

    const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)

    return NextResponse.json({
      path,
      url: urlData.publicUrl,
      documentType,
      fileName: file.name,
      fileSize: file.size,
    })
  } catch (error) {
    console.error('Document upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
