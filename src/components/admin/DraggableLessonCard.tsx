'use client'

import { useRef, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Video, FileText, ClipboardList, Play, Edit, Trash2, Eye, Clock, Star, Upload, Loader2, CheckCircle2 } from 'lucide-react'
import type { Lesson, ContentType } from '@/types'

interface DraggableLessonCardProps {
  lesson: Lesson
  index: number
  onPreview: (lesson: Lesson) => void
  onEdit: (lesson: Lesson) => void
  onDelete: (id: string, title: string, type: string) => void
  onVideoUploaded?: () => void
  courseId: string
  isDeleting: boolean
  isSelected?: boolean
  onSelectChange?: (checked: boolean) => void
}

function getContentIcon(type: ContentType) {
  switch (type) {
    case 'video': return <Video className="h-4 w-4" />
    case 'document': return <FileText className="h-4 w-4" />
    case 'quiz': return <ClipboardList className="h-4 w-4" />
    default: return <FileText className="h-4 w-4" />
  }
}

function getContentColor(type: ContentType) {
  switch (type) {
    case 'video': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
    case 'document': return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
    case 'quiz': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
    default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  }
}

function getVideoDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => { URL.revokeObjectURL(video.src); resolve(video.duration) }
    video.onerror = () => { URL.revokeObjectURL(video.src); resolve(null) }
    video.src = URL.createObjectURL(file)
  })
}

export function DraggableLessonCard({
  lesson,
  index,
  onPreview,
  onEdit,
  onDelete,
  onVideoUploaded,
  courseId,
  isDeleting,
  isSelected,
  onSelectChange,
}: DraggableLessonCardProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id })

  const handleFileUpload = async (file: File) => {
    setIsUploading(true)
    try {
      const { directUpload } = await import('@/lib/uploads/direct-upload')
      const { setLessonVideo } = await import('@/lib/api/admin-lessons-client')

      const duration = await getVideoDuration(file)

      const ticket = await directUpload(courseId, 'video', file)

      await setLessonVideo(lesson.id, ticket.path, duration)
      onVideoUploaded?.()
    } catch (err) {
      console.error('Video upload failed:', err)
    } finally {
      setIsUploading(false)
    }
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="group relative">
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-lg bg-card border border-border shadow-sm hover:bg-muted cursor-grab active:cursor-grabbing touch-none"
        title="Drag to reorder"
        aria-label={`Drag to reorder ${lesson.title ?? lesson.title_ar ?? "lesson"}`}
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>

      {/* Card */}
      <div
        className={`ml-12 rounded-lg border bg-card p-4 transition-all hover:shadow-md ${
          isSelected
            ? 'border-brand-500 ring-2 ring-brand-500/20'
            : 'border-border'
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {/* Selection checkbox */}
            {onSelectChange && (
              <label
                className="flex h-10 w-5 flex-shrink-0 items-center justify-center cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={!!isSelected}
                  onChange={(e) => onSelectChange(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500 cursor-pointer"
                  aria-label={`Select lesson ${lesson.title ?? lesson.title_ar ?? "lesson"}`}
                />
              </label>
            )}
            {/* Content type badge */}
            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${getContentColor(lesson.content_type)}`}>
              {getContentIcon(lesson.content_type)}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground">
                  #{index + 1}
                </span>
                <h4 className="font-medium text-foreground truncate">
                  {lesson.title || lesson.title_ar || "Untitled lesson"}
                </h4>
              </div>
              {/* Show the other-language title as a secondary line whenever both exist */}
              {lesson.title && lesson.title_ar && (
                <p className="text-sm text-muted-foreground truncate" dir="rtl">
                  {lesson.title_ar}
                </p>
              )}
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${getContentColor(lesson.content_type)}`}>
                  {getContentIcon(lesson.content_type)}
                  {lesson.content_type}
                </span>
                {lesson.content_type === 'video' && lesson.video_duration_seconds && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {Math.floor(lesson.video_duration_seconds / 60)}:{(lesson.video_duration_seconds % 60).toString().padStart(2, '0')}
                  </span>
                )}
                {lesson.is_mandatory && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 font-medium text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                    <Star className="h-3 w-3" />
                    Required
                  </span>
                )}
                {lesson.is_preview && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
                    <Eye className="h-3 w-3" />
                    Preview
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {lesson.content_type === 'video' && lesson.video_url && (
              <button
                onClick={() => onPreview(lesson)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                title="Preview"
              >
                <Play className="h-4 w-4" />
              </button>
            )}
            {lesson.content_type === 'video' && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file)
                    e.target.value = ''
                  }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className={`rounded-lg p-2 transition-colors ${
                    lesson.video_url
                      ? 'text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950'
                      : 'text-muted-foreground hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950'
                  }`}
                  title={lesson.video_url ? 'Replace video' : 'Upload video'}
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : lesson.video_url ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                </button>
              </>
            )}
            <button
              onClick={() => onEdit(lesson)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(lesson.id, lesson.title ?? lesson.title_ar ?? "Untitled lesson", lesson.content_type)}
              disabled={isDeleting}
              className="rounded-lg p-2 text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 disabled:opacity-50"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
