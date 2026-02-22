'use client'

import { useState } from 'react'
import { X, Loader2, Upload, Video, FileText, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { Lesson } from '@/types'

interface EditContentDialogProps {
  lesson: Lesson
  onClose: () => void
  onSuccess: () => void
}

export function EditContentDialog({ lesson, onClose, onSuccess }: EditContentDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploadedFile, setUploadedFile] = useState<{ url: string; path: string; duration?: number } | null>(null)
  const [showUploadSection, setShowUploadSection] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const [formData, setFormData] = useState({
    title: lesson.title,
    title_ar: lesson.title_ar || '',
    description: lesson.description || '',
    description_ar: lesson.description_ar || '',
    is_mandatory: lesson.is_mandatory,
    is_preview: lesson.is_preview,
    force_watch_first: (lesson.metadata as Record<string, unknown>)?.force_watch_first as boolean ?? false,
    allow_speed_control: (lesson.metadata as Record<string, unknown>)?.allow_speed_control as boolean ?? true,
    allow_download: (lesson.metadata as Record<string, unknown>)?.allow_download as boolean ?? false,
    minimum_watch_percentage: ((lesson.metadata as Record<string, unknown>)?.minimum_watch_percentage as number ?? 90).toString(),
  })

  const handleFileUpload = async (file: File) => {
    if (!file) return
    setError('')
    setIsUploading(true)
    setUploadProgress(0)

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 5, 90))
    }, 500)

    try {
      let duration: number | undefined
      if (lesson.content_type === 'video') {
        duration = await new Promise<number>((resolve) => {
          const video = document.createElement('video')
          video.preload = 'metadata'
          video.onloadedmetadata = () => { resolve(Math.round(video.duration)); URL.revokeObjectURL(video.src) }
          video.onerror = () => resolve(0)
          video.src = URL.createObjectURL(file)
        })
      }

      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      formDataUpload.append('courseId', lesson.course_id)
      formDataUpload.append('lessonId', lesson.id)
      if (duration) formDataUpload.append('duration', duration.toString())

      const response = await fetch('/api/video/upload', {
        method: 'POST',
        body: formDataUpload,
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Upload failed')
      }

      const data = await response.json()
      setUploadProgress(100)
      setUploadedFile({ url: data.url || data.path, path: data.path, duration })
      setShowUploadSection(false)
      toast.success('File uploaded')
    } catch (err) {
      clearInterval(progressInterval)
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const supabase = createClient()

      const updateData: Record<string, unknown> = {
        title: formData.title.trim(),
        title_ar: formData.title_ar.trim() || null,
        description: formData.description.trim() || null,
        description_ar: formData.description_ar.trim() || null,
        is_mandatory: formData.is_mandatory,
        is_preview: formData.is_preview,
      }

      // Update video settings in metadata
      if (lesson.content_type === 'video') {
        updateData.metadata = {
          ...(lesson.metadata as Record<string, unknown>),
          force_watch_first: formData.force_watch_first,
          allow_speed_control: formData.allow_speed_control,
          allow_download: formData.allow_download,
          minimum_watch_percentage: parseInt(formData.minimum_watch_percentage) || 90,
        }
      }

      // Update file if replaced
      if (uploadedFile) {
        if (lesson.content_type === 'video') {
          updateData.video_url = uploadedFile.url
          if (uploadedFile.duration) {
            updateData.video_duration_seconds = uploadedFile.duration
            updateData.duration_minutes = Math.ceil(uploadedFile.duration / 60)
          }
        } else if (lesson.content_type === 'document') {
          updateData.document_url = uploadedFile.url
        }
      }

      const { error: updateError } = await supabase
        .from('lessons')
        .update(updateData)
        .eq('id', lesson.id)

      if (updateError) throw updateError

      toast.success('Lesson updated')
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update lesson')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg bg-card p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Edit Lesson</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Titles */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground">Title (English) *</label>
              <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Title (Arabic)</label>
              <input type="text" dir="rtl" value={formData.title_ar} onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>

          {/* Descriptions */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground">Description (English)</label>
              <textarea rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Description (Arabic)</label>
              <textarea rows={3} dir="rtl" value={formData.description_ar} onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>

          {/* File Upload (video/document only) */}
          {(lesson.content_type === 'video' || lesson.content_type === 'document') && (
            <div className="space-y-3 rounded-lg border border-border bg-muted/50 p-4">
              <h3 className="text-sm font-semibold text-foreground">
                {lesson.content_type === 'video' ? 'Video' : 'Document'} File
              </h3>
              <div className="flex items-center gap-2 text-sm">
                {lesson.content_type === 'video' ? <Video className="h-4 w-4 text-muted-foreground" /> : <FileText className="h-4 w-4 text-muted-foreground" />}
                {uploadedFile ? (
                  <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    New file uploaded — will be saved on update
                  </span>
                ) : (lesson.video_url || lesson.document_url) ? (
                  <span className="text-muted-foreground">File uploaded</span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400">No file uploaded</span>
                )}
              </div>

              {!showUploadSection && !isUploading && (
                <button type="button" onClick={() => setShowUploadSection(true)} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted">
                  <Upload className="h-4 w-4" />
                  {(lesson.video_url || lesson.document_url || uploadedFile) ? 'Replace File' : 'Upload File'}
                </button>
              )}

              {showUploadSection && !isUploading && (
                <div className="space-y-2">
                  <input
                    type="file"
                    accept={lesson.content_type === 'video' ? 'video/mp4,video/webm,video/quicktime' : 'application/pdf'}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f) }}
                    className="block w-full text-sm text-foreground file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-primary/90"
                  />
                  <button type="button" onClick={() => setShowUploadSection(false)} className="text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                </div>
              )}

              {isUploading && (
                <div>
                  <div className="flex items-center gap-3 mb-2"><Loader2 className="h-4 w-4 animate-spin text-primary" /><span className="text-sm">Uploading...</span></div>
                  <div className="h-2 w-full rounded-full bg-muted"><div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${uploadProgress}%` }} /></div>
                </div>
              )}
            </div>
          )}

          {/* Settings */}
          <div className="space-y-3 rounded-lg border border-border bg-muted/50 p-4">
            <h3 className="text-sm font-semibold text-foreground">Settings</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={formData.is_mandatory} onChange={(e) => setFormData({ ...formData, is_mandatory: e.target.checked })} className="h-4 w-4 rounded border-border text-primary" /> Required</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={formData.is_preview} onChange={(e) => setFormData({ ...formData, is_preview: e.target.checked })} className="h-4 w-4 rounded border-border text-primary" /> Free Preview</label>
              {lesson.content_type === 'video' && (
                <>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={formData.force_watch_first} onChange={(e) => setFormData({ ...formData, force_watch_first: e.target.checked })} className="h-4 w-4 rounded border-border text-primary" /> Force First Watch</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={formData.allow_speed_control} onChange={(e) => setFormData({ ...formData, allow_speed_control: e.target.checked })} className="h-4 w-4 rounded border-border text-primary" /> Allow Speed Control</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={formData.allow_download} onChange={(e) => setFormData({ ...formData, allow_download: e.target.checked })} className="h-4 w-4 rounded border-border text-primary" /> Allow Download</label>
                </>
              )}
            </div>
            {lesson.content_type === 'video' && (
              <div>
                <label className="block text-sm font-medium text-foreground">Minimum Watch Percentage *</label>
                <div className="mt-1 flex items-center gap-2">
                  <input type="number" min="0" max="100" value={formData.minimum_watch_percentage} onChange={(e) => setFormData({ ...formData, minimum_watch_percentage: e.target.value })} className="w-24 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground" />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} disabled={isLoading} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={isLoading} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading ? 'Updating...' : 'Update Lesson'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
