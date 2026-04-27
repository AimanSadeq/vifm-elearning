'use client'

import { useState } from 'react'
import { X, Save, Loader2, Video, FileText, ClipboardList } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { directUpload } from '@/lib/uploads/direct-upload'
import type { ContentType } from '@/types'

interface AddContentDialogProps {
  courseId: string
  moduleId: string
  existingLessonCount: number
  onClose: () => void
  onSuccess: () => void
}

export function AddContentDialog({
  courseId,
  moduleId,
  existingLessonCount,
  onClose,
  onSuccess,
}: AddContentDialogProps) {
  const [step, setStep] = useState<'type' | 'upload' | 'details'>('type')
  const [contentType, setContentType] = useState<ContentType | null>(null)
  const [uploadedFile, setUploadedFile] = useState<{
    url: string
    path: string
    duration?: number
    documentType?: 'pdf' | 'zip' | 'word' | 'excel'
    fileName?: string
    fileSize?: number
  } | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    title_ar: '',
    description: '',
    description_ar: '',
    is_mandatory: true,
    is_preview: false,
    force_watch_first: false,
    allow_speed_control: true,
    allow_download: false,
    minimum_watch_percentage: '90',
  })

  const handleTypeSelect = (type: ContentType) => {
    setContentType(type)
    if (type === 'quiz') {
      // Go directly to details — quizzes are managed via the quizzes page
      setStep('details')
    } else {
      setStep('upload')
    }
  }

  // Handle video file upload
  const handleFileUpload = async (file: File) => {
    if (!file) return

    // Validate
    const lowerName = file.name.toLowerCase()
    const hasExt = (...exts: string[]) => exts.some((e) => lowerName.endsWith(e))
    const isZip =
      file.type === 'application/zip' ||
      file.type === 'application/x-zip-compressed' ||
      hasExt('.zip')
    const isPdf = file.type === 'application/pdf' || hasExt('.pdf')
    const isWord =
      file.type === 'application/msword' ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      hasExt('.doc', '.docx')
    const isExcel =
      file.type === 'application/vnd.ms-excel' ||
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      hasExt('.xls', '.xlsx')

    if (contentType === 'video') {
      const allowed = ['video/mp4', 'video/webm', 'video/quicktime']
      if (!allowed.includes(file.type)) {
        setError('Only MP4, WebM, and MOV files are allowed')
        return
      }
      if (file.size > 2 * 1024 * 1024 * 1024) {
        setError('File size must be under 2GB')
        return
      }
    } else if (contentType === 'document') {
      if (!isPdf && !isZip && !isWord && !isExcel) {
        setError('Only PDF, Word, Excel, or ZIP files are allowed')
        return
      }
      if (isZip && file.size > 500 * 1024 * 1024) {
        setError('ZIP must be under 500MB')
        return
      }
      if (!isZip && file.size > 100 * 1024 * 1024) {
        setError('File must be under 100MB')
        return
      }
    }

    setError(null)
    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Detect video duration client-side
      let duration: number | undefined
      if (contentType === 'video') {
        duration = await new Promise<number>((resolve) => {
          const video = document.createElement('video')
          video.preload = 'metadata'
          video.onloadedmetadata = () => {
            resolve(Math.round(video.duration))
            URL.revokeObjectURL(video.src)
          }
          video.onerror = () => resolve(0)
          video.src = URL.createObjectURL(file)
        })
      }

      const kind: 'video' | 'document' = contentType === 'video' ? 'video' : 'document'
      const ticket = await directUpload(courseId, kind, file, (pct) =>
        setUploadProgress(pct)
      )

      setUploadProgress(100)
      setUploadedFile({
        url: ticket.path,
        path: ticket.path,
        duration,
        documentType: ticket.documentType,
        fileName: file.name,
        fileSize: file.size,
      })
      toast.success('File uploaded successfully')
      setStep('details')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() && !formData.title_ar.trim()) {
      setError('Provide a lesson title in English or Arabic — at least one is required')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()

      const lessonData: Record<string, unknown> = {
        course_id: courseId,
        module_id: moduleId,
        title: formData.title.trim() || null,
        title_ar: formData.title_ar.trim() || null,
        description: formData.description.trim() || null,
        description_ar: formData.description_ar.trim() || null,
        content_type: contentType,
        sort_order: existingLessonCount,
        is_mandatory: formData.is_mandatory,
        is_preview: formData.is_preview,
        metadata: {},
      }

      if (contentType === 'video') {
        lessonData.video_url = uploadedFile?.url || null
        lessonData.video_duration_seconds = uploadedFile?.duration || null
        lessonData.duration_minutes = uploadedFile?.duration
          ? Math.ceil(uploadedFile.duration / 60)
          : 0
      } else if (contentType === 'document') {
        lessonData.document_url = uploadedFile?.url || null
        lessonData.document_type = uploadedFile?.documentType || 'pdf'
        lessonData.metadata = {
          ...(lessonData.metadata as Record<string, unknown>),
          file_name: uploadedFile?.fileName,
          file_size: uploadedFile?.fileSize,
        }
      }

      // Store video settings in metadata
      if (contentType === 'video') {
        lessonData.metadata = {
          force_watch_first: formData.force_watch_first,
          allow_speed_control: formData.allow_speed_control,
          allow_download: formData.allow_download,
          minimum_watch_percentage: parseInt(formData.minimum_watch_percentage) || 90,
        }
      }

      const { error: insertError } = await supabase.from('lessons').insert(lessonData)
      if (insertError) throw insertError

      toast.success('Lesson added successfully')
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create lesson')
    } finally {
      setIsSubmitting(false)
    }
  }

  const steps = contentType === 'quiz'
    ? [
        { key: 'type', label: 'Type', number: 1 },
        { key: 'details', label: 'Details', number: 2 },
      ]
    : [
        { key: 'type', label: 'Type', number: 1 },
        { key: 'upload', label: 'Upload', number: 2 },
        { key: 'details', label: 'Details', number: 3 },
      ]

  const currentIndex = steps.findIndex((s) => s.key === step)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-card shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Add Lesson</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {step === 'type' && 'Choose content type'}
              {step === 'upload' && `Upload ${contentType} file`}
              {step === 'details' && 'Add lesson details'}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Close dialog">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Progress */}
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            {steps.map((s, i) => (
              <div key={s.key} className="flex items-center flex-1">
                <div className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                    i < currentIndex ? 'bg-green-500 text-white'
                    : i === currentIndex ? 'bg-primary text-white'
                    : 'bg-muted text-muted-foreground'
                  }`}>
                    {i < currentIndex ? (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : s.number}
                  </div>
                  <span className={`text-sm font-medium ${i <= currentIndex ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`mx-3 h-0.5 flex-1 rounded ${i < currentIndex ? 'bg-green-500' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Step 1: Type Selection */}
          {step === 'type' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <button
                onClick={() => handleTypeSelect('video')}
                className="flex flex-col items-center gap-3 rounded-lg border-2 border-border p-6 text-center transition-colors hover:border-primary hover:bg-primary/5"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                  <Video className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Video</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Upload MP4, WebM, MOV</p>
                </div>
              </button>

              <button
                onClick={() => handleTypeSelect('document')}
                className="flex flex-col items-center gap-3 rounded-lg border-2 border-border p-6 text-center transition-colors hover:border-primary hover:bg-primary/5"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
                  <FileText className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Document</h3>
                  <p className="mt-1 text-sm text-muted-foreground">PDF, Word, Excel, or ZIP</p>
                </div>
              </button>

              <button
                onClick={() => handleTypeSelect('quiz')}
                className="flex flex-col items-center gap-3 rounded-lg border-2 border-border p-6 text-center transition-colors hover:border-purple-500 hover:bg-purple-50 dark:hover:border-purple-600 dark:hover:bg-purple-950/50"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                  <ClipboardList className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Quiz</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Assessment lesson</p>
                </div>
              </button>

              <button
                disabled
                className="flex flex-col items-center gap-3 rounded-lg border-2 border-border p-6 text-center opacity-50"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Assignment</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Coming soon</p>
                </div>
              </button>
            </div>
          )}

          {/* Step 2: Upload */}
          {step === 'upload' && contentType && (
            <div className="space-y-4">
              {!uploadedFile && !isUploading && (
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-12">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept={contentType === 'video'
                      ? 'video/mp4,video/webm,video/quicktime'
                      : [
                          'application/pdf',
                          'application/zip',
                          'application/x-zip-compressed',
                          'application/msword',
                          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                          'application/vnd.ms-excel',
                          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                          '.pdf',
                          '.zip',
                          '.doc',
                          '.docx',
                          '.xls',
                          '.xlsx',
                        ].join(',')}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file)
                    }}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer text-center">
                    {contentType === 'video' ? (
                      <Video className="mx-auto h-12 w-12 text-muted-foreground" />
                    ) : (
                      <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                    )}
                    <p className="mt-4 text-sm font-medium text-foreground">
                      Click to select {contentType === 'video' ? 'video' : 'document'}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {contentType === 'video'
                        ? 'MP4, WebM, MOV up to 2GB'
                        : 'PDF / Word / Excel up to 100MB · ZIP up to 500MB'}
                    </p>
                  </label>
                </div>
              )}

              {isUploading && (
                <div className="rounded-lg border border-border p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-sm font-medium">Uploading...</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{uploadProgress}%</p>
                </div>
              )}

              {uploadedFile && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">
                    File uploaded successfully
                    {uploadedFile.duration
                      ? ` · Duration: ${Math.floor(uploadedFile.duration / 60)}:${(uploadedFile.duration % 60).toString().padStart(2, '0')}`
                      : uploadedFile.documentType
                      ? ` · ${uploadedFile.documentType.toUpperCase()}${uploadedFile.fileSize ? ` · ${(uploadedFile.fileSize / (1024 * 1024)).toFixed(1)} MB` : ''}`
                      : ''}
                  </p>
                </div>
              )}

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => { setStep('type'); setContentType(null); setUploadedFile(null); setError(null) }}
                  className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {step === 'details' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Fill in at least one language — Arabic-only lessons appear in the Arabic version of the course only, and vice versa.
                </p>
                <div>
                  <label className="block text-sm font-medium text-foreground">Title (English)</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="e.g., Introduction to Risk Assessment"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">Title (Arabic)</label>
                  <input
                    type="text"
                    dir="rtl"
                    value={formData.title_ar}
                    onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="مثال: مقدمة لتقييم المخاطر"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">Description (English)</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">Description (Arabic)</label>
                  <textarea
                    rows={3}
                    dir="rtl"
                    value={formData.description_ar}
                    onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-3 rounded-lg border border-border bg-muted/50 p-4">
                <h3 className="text-sm font-semibold text-foreground">Settings</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 text-sm">
                    <input type="checkbox" checked={formData.is_mandatory} onChange={(e) => setFormData({ ...formData, is_mandatory: e.target.checked })} className="h-4 w-4 rounded border-border text-primary" />
                    Required (must be completed)
                  </label>
                  <label className="flex items-center gap-3 text-sm">
                    <input type="checkbox" checked={formData.is_preview} onChange={(e) => setFormData({ ...formData, is_preview: e.target.checked })} className="h-4 w-4 rounded border-border text-primary" />
                    Free preview (visible without enrollment)
                  </label>
                  {contentType === 'video' && (
                    <>
                      <label className="flex items-center gap-3 text-sm">
                        <input type="checkbox" checked={formData.force_watch_first} onChange={(e) => setFormData({ ...formData, force_watch_first: e.target.checked })} className="h-4 w-4 rounded border-border text-primary" />
                        Force first watch (no skip/fast-forward)
                      </label>
                      <label className="flex items-center gap-3 text-sm">
                        <input type="checkbox" checked={formData.allow_speed_control} onChange={(e) => setFormData({ ...formData, allow_speed_control: e.target.checked })} className="h-4 w-4 rounded border-border text-primary" />
                        Allow playback speed control
                      </label>
                      <label className="flex items-center gap-3 text-sm">
                        <input type="checkbox" checked={formData.allow_download} onChange={(e) => setFormData({ ...formData, allow_download: e.target.checked })} className="h-4 w-4 rounded border-border text-primary" />
                        Allow download
                      </label>
                      <div>
                        <label className="block text-sm font-medium text-foreground">
                          Minimum Watch Percentage *
                        </label>
                        <div className="mt-1 flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={formData.minimum_watch_percentage}
                            onChange={(e) => setFormData({ ...formData, minimum_watch_percentage: e.target.value })}
                            className="w-24 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
                          />
                          <span className="text-sm text-muted-foreground">%</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 border-t border-border pt-6">
                <button
                  type="button"
                  onClick={() => {
                    if (contentType === 'quiz') { setStep('type'); setContentType(null) }
                    else setStep('upload')
                  }}
                  className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="h-4 w-4" /> Save Lesson</>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
