'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Video, FileText, ClipboardList, Play, Edit, Trash2, Eye, Clock, Star } from 'lucide-react'
import type { Lesson, ContentType } from '@/types'

interface DraggableLessonCardProps {
  lesson: Lesson
  index: number
  onPreview: (lesson: Lesson) => void
  onEdit: (lesson: Lesson) => void
  onDelete: (id: string, title: string, type: string) => void
  isDeleting: boolean
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

export function DraggableLessonCard({
  lesson,
  index,
  onPreview,
  onEdit,
  onDelete,
  isDeleting,
}: DraggableLessonCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id })

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
        aria-label={`Drag to reorder ${lesson.title}`}
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>

      {/* Card */}
      <div className="ml-12 rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
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
                  {lesson.title}
                </h4>
              </div>
              {lesson.title_ar && (
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
            <button
              onClick={() => onEdit(lesson)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(lesson.id, lesson.title, lesson.content_type)}
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
