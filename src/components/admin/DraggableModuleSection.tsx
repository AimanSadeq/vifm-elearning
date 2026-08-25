'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  ChevronDown,
  ChevronRight,
  Clock,
  GripVertical,
  Loader2,
  Pencil,
  Plus,
  Star,
  Trash2,
  Upload,
} from 'lucide-react'
import { DraggableLessonCard } from './DraggableLessonCard'
import type { Lesson, Module } from '@/types'

interface DraggableModuleSectionProps {
  module: Module & { lessons: Lesson[] }
  courseId: string
  isCollapsed: boolean
  isReorderingLessons: boolean
  isDeleting: boolean
  deletingLessonId: string | null
  onToggle: (moduleId: string) => void
  onAddLesson: (moduleId: string) => void
  onBulkUpload: (moduleId: string) => void
  onEditModule: (module: Module & { lessons: Lesson[] }) => void
  onDeleteModule: (moduleId: string, title: string, lessonCount: number) => void
  onLessonDragEnd: (event: DragEndEvent, moduleId: string) => void
  onLessonPreview: (lesson: Lesson) => void
  onLessonEdit: (lesson: Lesson) => void
  onLessonDelete: (id: string, title: string, type: string) => void
  onVideoUploaded: () => void
  selectedLessonIds: Set<string>
  onLessonSelectChange: (id: string, checked: boolean) => void
  onToggleAllInModule: (moduleId: string, allLessonIds: string[]) => void
}

export function DraggableModuleSection({
  module: mod,
  courseId,
  isCollapsed,
  isReorderingLessons,
  isDeleting,
  deletingLessonId,
  onToggle,
  onAddLesson,
  onBulkUpload,
  onEditModule,
  onDeleteModule,
  onLessonDragEnd,
  onLessonPreview,
  onLessonEdit,
  onLessonDelete,
  onVideoUploaded,
  selectedLessonIds,
  onLessonSelectChange,
  onToggleAllInModule,
}: DraggableModuleSectionProps) {
  const moduleLessonIds = mod.lessons.map((l) => l.id)
  const selectedInModule = moduleLessonIds.filter((id) => selectedLessonIds.has(id)).length
  const allSelected = moduleLessonIds.length > 0 && selectedInModule === moduleLessonIds.length
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: mod.id })

  const lessonSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const durationMinutes = Math.ceil(
    mod.lessons
      .filter((l) => l.content_type === 'video' && l.video_duration_seconds)
      .reduce((t, l) => t + (l.video_duration_seconds || 0), 0) / 60
  )
  const requiredCount = mod.lessons.filter((l) => l.is_mandatory).length

  return (
    <section
      ref={setNodeRef}
      style={style}
      className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
    >
      {/* Module Header */}
      <header
        className={`bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 px-6 py-5 dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-blue-950/30 ${
          isCollapsed ? '' : 'border-b border-border'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              {...attributes}
              {...listeners}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-card text-muted-foreground shadow-sm ring-1 ring-border transition-all hover:bg-muted hover:text-foreground cursor-grab active:cursor-grabbing touch-none"
              title="Drag to reorder module"
              aria-label={`Drag to reorder ${mod.title ?? mod.title_ar ?? "module"}`}
            >
              <GripVertical className="h-5 w-5" />
            </button>
            <button
              onClick={() => onToggle(mod.id)}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg transition-transform hover:scale-105"
              aria-expanded={!isCollapsed}
              title={isCollapsed ? 'Expand module' : 'Collapse module'}
            >
              {isCollapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>
            <button onClick={() => onToggle(mod.id)} className="text-left">
              <h3 className="text-lg font-bold text-foreground">{mod.title || mod.title_ar || "Untitled module"}</h3>
              {/* Secondary line shows the other language only when both exist */}
              {mod.title && mod.title_ar && (
                <p className="text-sm text-muted-foreground" dir="rtl">
                  {mod.title_ar}
                </p>
              )}
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {mod.lessons.length}{' '}
                  {mod.lessons.length === 1 ? 'lesson' : 'lessons'}
                </span>
                {durationMinutes > 0 && (
                  <>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {durationMinutes} min
                    </span>
                  </>
                )}
                {requiredCount > 0 && (
                  <>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1 font-medium text-orange-700 dark:text-orange-400">
                      <Star className="h-3.5 w-3.5" />
                      {requiredCount} required
                    </span>
                  </>
                )}
              </div>
            </button>
          </div>
          <div className="flex items-center gap-2">
            {mod.lessons.length > 0 && (
              <label
                className="inline-flex items-center gap-2 rounded-lg bg-card px-3 py-2 text-xs font-medium text-muted-foreground shadow-sm ring-1 ring-border cursor-pointer hover:bg-muted"
                title={allSelected ? 'Clear selection' : 'Select all in module'}
              >
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() => onToggleAllInModule(mod.id, moduleLessonIds)}
                  className="h-3.5 w-3.5 rounded border-border text-brand-600 focus:ring-brand-500"
                  aria-label="Select all lessons in module"
                />
                {selectedInModule > 0 ? `${selectedInModule}/${mod.lessons.length}` : 'Select'}
              </label>
            )}
            <button
              onClick={() => onAddLesson(mod.id)}
              className="inline-flex items-center gap-2 rounded-lg bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm ring-1 ring-border transition-all hover:bg-muted hover:shadow-md"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Lesson</span>
              <span className="sm:hidden">Add</span>
            </button>
            <button
              onClick={() => onBulkUpload(mod.id)}
              className="inline-flex items-center gap-2 rounded-lg bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm ring-1 ring-border transition-all hover:bg-muted hover:shadow-md"
              title="Upload multiple videos at once"
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Bulk Upload Videos</span>
              <span className="sm:hidden">Bulk</span>
            </button>
            <button
              onClick={() => onEditModule(mod)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-card text-muted-foreground shadow-sm ring-1 ring-border transition-all hover:bg-muted hover:text-foreground hover:shadow-md"
              title="Edit module name"
              aria-label={`Edit ${mod.title ?? mod.title_ar ?? "module"}`}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDeleteModule(mod.id, mod.title ?? mod.title_ar ?? "Untitled module", mod.lessons.length)}
              disabled={isDeleting}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-card text-red-600 shadow-sm ring-1 ring-border transition-all hover:bg-red-50 hover:text-red-700 hover:shadow-md disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/30"
              title="Delete module"
              aria-label="Delete module"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Module Content (collapsible) */}
      {!isCollapsed && (
        <div className="relative">
          {mod.lessons.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-muted-foreground">
              <p className="text-sm">No lessons in this module yet</p>
              <button
                onClick={() => onAddLesson(mod.id)}
                className="mt-2 text-sm font-medium text-primary hover:underline"
              >
                Add first lesson
              </button>
            </div>
          ) : (
            <DndContext
              sensors={lessonSensors}
              collisionDetection={closestCenter}
              onDragEnd={(event) => onLessonDragEnd(event, mod.id)}
            >
              <SortableContext
                items={mod.lessons.map((l) => l.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="grid gap-4 p-6">
                  {isReorderingLessons && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center rounded-b-xl bg-background/50">
                      <div className="flex items-center gap-2 rounded-lg bg-card px-4 py-2 shadow-lg">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-sm font-medium">Updating order...</span>
                      </div>
                    </div>
                  )}
                  {mod.lessons.map((lesson, index) => (
                    <DraggableLessonCard
                      key={lesson.id}
                      lesson={lesson}
                      index={index}
                      courseId={courseId}
                      onPreview={onLessonPreview}
                      onEdit={onLessonEdit}
                      onDelete={onLessonDelete}
                      onVideoUploaded={onVideoUploaded}
                      isDeleting={deletingLessonId === lesson.id}
                      isSelected={selectedLessonIds.has(lesson.id)}
                      onSelectChange={(checked) => onLessonSelectChange(lesson.id, checked)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}
    </section>
  )
}
