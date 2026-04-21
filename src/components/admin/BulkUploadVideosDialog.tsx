'use client'

import { useState } from 'react'
import {
  CheckCircle2,
  Film,
  Loader2,
  Trash2,
  Upload,
  X,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface BulkUploadVideosDialogProps {
  courseId: string
  moduleId: string
  existingLessonCount: number
  onClose: () => void
  onSuccess: () => void
}

type RowStatus = 'pending' | 'uploading' | 'done' | 'error'

interface Row {
  id: string
  file: File
  title: string
  sizeMb: number
  status: RowStatus
  progress: number
  error?: string
}

const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024 // 2 GB

function titleFromFileName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, '')
  const spaced = base.replace(/[_\-\s]+/g, ' ').trim()
  return spaced
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(' ')
}

function getVideoDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      resolve(Math.round(video.duration))
      URL.revokeObjectURL(video.src)
    }
    video.onerror = () => {
      URL.revokeObjectURL(video.src)
      resolve(null)
    }
    video.src = URL.createObjectURL(file)
  })
}

export function BulkUploadVideosDialog({
  courseId,
  moduleId,
  existingLessonCount,
  onClose,
  onSuccess,
}: BulkUploadVideosDialogProps) {
  const [rows, setRows] = useState<Row[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)

  const addFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const incoming: Row[] = []
    const rejected: string[] = []

    Array.from(files).forEach((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        rejected.push(`${file.name} — unsupported type`)
        return
      }
      if (file.size > MAX_FILE_SIZE) {
        rejected.push(`${file.name} — over 2GB`)
        return
      }
      incoming.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        file,
        title: titleFromFileName(file.name),
        sizeMb: file.size / (1024 * 1024),
        status: 'pending',
        progress: 0,
      })
    })

    if (rejected.length > 0) {
      setGlobalError(`Skipped ${rejected.length} file(s): ${rejected.join(', ')}`)
    } else {
      setGlobalError(null)
    }

    setRows((prev) => [...prev, ...incoming])
  }

  const updateRow = (id: string, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id))
  }

  const uploadOne = async (
    row: Row,
    sortOrder: number
  ): Promise<{ ok: boolean; error?: string }> => {
    const supabase = createClient()

    updateRow(row.id, { status: 'uploading', progress: 10, error: undefined })

    try {
      const duration = await getVideoDuration(row.file)

      const fd = new FormData()
      fd.append('file', row.file)
      fd.append('courseId', courseId)
      fd.append('lessonId', 'pending')
      if (duration) fd.append('duration', String(duration))

      updateRow(row.id, { progress: 40 })

      const res = await fetch('/api/video/upload', {
        method: 'POST',
        body: fd,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Upload failed (${res.status})`)
      }

      const data = await res.json()
      updateRow(row.id, { progress: 80 })

      const lessonData = {
        course_id: courseId,
        module_id: moduleId,
        title: row.title.trim() || titleFromFileName(row.file.name),
        content_type: 'video' as const,
        sort_order: sortOrder,
        is_mandatory: true,
        is_preview: false,
        video_url: data.url || data.path,
        video_duration_seconds: duration || null,
        duration_minutes: duration ? Math.ceil(duration / 60) : 0,
        metadata: {
          allow_speed_control: true,
          allow_download: false,
          force_watch_first: false,
          minimum_watch_percentage: 90,
        },
      }

      const { error: insertError } = await supabase.from('lessons').insert(lessonData)
      if (insertError) throw insertError

      updateRow(row.id, { status: 'done', progress: 100 })
      return { ok: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      updateRow(row.id, { status: 'error', progress: 0, error: message })
      return { ok: false, error: message }
    }
  }

  const handleUpload = async () => {
    const queue = rows.filter((r) => r.status === 'pending' || r.status === 'error')
    if (queue.length === 0) return

    setIsUploading(true)
    setGlobalError(null)

    let sortOrder = existingLessonCount + rows.filter((r) => r.status === 'done').length
    let successes = 0
    let failures = 0

    for (const row of queue) {
      // Re-fetch latest version of row in case user edited title mid-flight.
      const current = rows.find((r) => r.id === row.id) || row
      const result = await uploadOne(current, sortOrder)
      if (result.ok) {
        successes += 1
        sortOrder += 1
      } else {
        failures += 1
      }
    }

    setIsUploading(false)

    if (successes > 0) {
      toast.success(
        `${successes} lesson${successes === 1 ? '' : 's'} created${
          failures > 0 ? `, ${failures} failed` : ''
        }`
      )
    } else if (failures > 0) {
      toast.error(`All ${failures} upload${failures === 1 ? '' : 's'} failed`)
    }

    if (successes > 0 && failures === 0) {
      onSuccess()
    } else if (successes > 0) {
      // Partial success: refresh parent view so completed rows appear,
      // but keep the dialog open so the user can retry the failed ones.
      onSuccess()
    }
  }

  const totalSizeMb = rows.reduce((t, r) => t + r.sizeMb, 0)
  const allDone =
    rows.length > 0 && rows.every((r) => r.status === 'done')
  const retryableCount = rows.filter(
    (r) => r.status === 'pending' || r.status === 'error'
  ).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-lg bg-card shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Bulk Upload Videos</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick multiple video files. Titles are generated from filenames — edit before uploading.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Drop zone / picker */}
          <label
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-8 text-center transition-colors cursor-pointer hover:bg-muted/40 ${
              isUploading ? 'pointer-events-none opacity-50' : ''
            }`}
          >
            <input
              type="file"
              multiple
              accept="video/mp4,video/webm,video/quicktime"
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files)
                e.target.value = ''
              }}
              disabled={isUploading}
            />
            <Film className="h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium text-foreground">
              Click to select videos
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              MP4, WebM, MOV · up to 2GB each · hold Shift/Cmd to pick multiple
            </p>
          </label>

          {globalError && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
              {globalError}
            </div>
          )}

          {rows.length > 0 && (
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 w-10">#</th>
                    <th className="px-3 py-2">Title (English)</th>
                    <th className="px-3 py-2 w-28">Size</th>
                    <th className="px-3 py-2 w-40">Status</th>
                    <th className="px-3 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={row.id} className="border-t border-border">
                      <td className="px-3 py-2 text-muted-foreground">
                        {existingLessonCount + i + 1}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={row.title}
                          onChange={(e) => updateRow(row.id, { title: e.target.value })}
                          disabled={row.status === 'uploading' || row.status === 'done'}
                          className="block w-full rounded-md border border-border bg-card px-2 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-70"
                          placeholder="Lesson title"
                        />
                        <p className="mt-0.5 text-xs text-muted-foreground truncate" title={row.file.name}>
                          {row.file.name}
                        </p>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {row.sizeMb.toFixed(1)} MB
                      </td>
                      <td className="px-3 py-2">
                        {row.status === 'pending' && (
                          <span className="text-muted-foreground">Pending</span>
                        )}
                        {row.status === 'uploading' && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-foreground">
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                              Uploading… {row.progress}%
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-muted">
                              <div
                                className="h-1.5 rounded-full bg-primary transition-all"
                                style={{ width: `${row.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                        {row.status === 'done' && (
                          <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-400">
                            <CheckCircle2 className="h-4 w-4" />
                            Created
                          </span>
                        )}
                        {row.status === 'error' && (
                          <span
                            className="inline-flex items-center gap-1 text-red-700 dark:text-red-400"
                            title={row.error}
                          >
                            <XCircle className="h-4 w-4" />
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {row.status !== 'uploading' && row.status !== 'done' && (
                          <button
                            onClick={() => removeRow(row.id)}
                            disabled={isUploading}
                            className="rounded-md p-1 text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 disabled:opacity-50"
                            aria-label="Remove"
                            title="Remove"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {rows.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {rows.length} file{rows.length === 1 ? '' : 's'} · {totalSizeMb.toFixed(1)} MB total
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border p-6">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
          >
            {allDone ? 'Close' : 'Cancel'}
          </button>
          <button
            onClick={handleUpload}
            disabled={isUploading || retryableCount === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                {retryableCount === rows.length
                  ? `Upload ${retryableCount} lesson${retryableCount === 1 ? '' : 's'}`
                  : `Retry ${retryableCount} failed`}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
