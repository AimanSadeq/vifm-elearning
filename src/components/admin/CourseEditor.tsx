'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Save,
  Edit,
  Loader2,
  ClipboardList,
  Plus,
  Trash2,
  Upload,
  ImagePlus,
  X,
  Clock,
  ChevronDown,
  ChevronRight,
  Star,
  BookOpen,
  Video,
} from 'lucide-react'
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { DraggableLessonCard } from './DraggableLessonCard'
import { AddModuleDialog } from './AddModuleDialog'
import { AddContentDialog } from './AddContentDialog'
import { EditContentDialog } from './EditContentDialog'
import { VideoPreview } from './VideoPreview'
import type { Course, Module, Lesson, Category, DifficultyLevel } from '@/types'

interface CourseEditorProps {
  course: Course
  modules: (Module & { lessons: Lesson[] })[]
  categories: Category[]
  instructors: { id: string; full_name: string }[]
}

type TabType = 'details' | 'content' | 'quizzes'

export function CourseEditor({ course, modules: initialModules, categories, instructors }: CourseEditorProps) {
  const router = useRouter()
  const _params = useParams()
  const locale = useLocale()
  const _t = useTranslations('admin')
  const [activeTab, setActiveTab] = useState<TabType>('content')
  const [isEditing, setIsEditing] = useState(false)
  const [showAddContent, setShowAddContent] = useState<string | null>(null) // moduleId
  const [showAddModule, setShowAddModule] = useState(false)
  const [previewLesson, setPreviewLesson] = useState<Lesson | null>(null)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [deletingLessonId, setDeletingLessonId] = useState<string | null>(null)
  const [modules, setModules] = useState(initialModules)
  const [isReordering, setIsReordering] = useState(false)
  const [collapsedModules, setCollapsedModules] = useState<Set<string>>(new Set())
  const [isSaving, setIsSaving] = useState(false)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(course.thumbnail_url || null)
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false)

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    id: string
    title: string
    type: string
  } | null>(null)

  const [courseForm, setCourseForm] = useState({
    title: course.title,
    title_ar: course.title_ar || '',
    description: course.description || '',
    description_ar: course.description_ar || '',
    short_description: course.short_description || '',
    short_description_ar: course.short_description_ar || '',
    category_id: course.category_id,
    instructor_id: course.instructor_id || '',
    difficulty_level: course.difficulty_level || 'beginner',
    price: course.price?.toString() || '0',
    currency: course.currency || 'USD',
    is_free: course.is_free,
    is_featured: course.is_featured,
    certificate_enabled: course.certificate_enabled,
    passing_score: course.passing_score?.toString() || '70',
    sequential_locking_enabled: course.sequential_locking_enabled ?? false,
    status: course.status,
  })

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Update modules when prop changes
  useEffect(() => {
    setModules(initialModules)
  }, [initialModules])

  // Re-fetch modules from DB (used after CRUD operations)
  const refreshModules = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('modules')
      .select('*, lessons(*)')
      .eq('course_id', course.id)
      .order('sort_order', { ascending: true })
    if (data) {
      const sorted = data.map((m: Module & { lessons: Lesson[] }) => ({
        ...m,
        lessons: (m.lessons || []).sort(
          (a: Lesson, b: Lesson) => a.sort_order - b.sort_order
        ),
      })) as (Module & { lessons: Lesson[] })[]
      setModules(sorted)
    }
  }, [course.id])

  const toggleModule = (moduleId: string) => {
    setCollapsedModules((prev) => {
      const next = new Set(prev)
      if (next.has(moduleId)) next.delete(moduleId)
      else next.add(moduleId)
      return next
    })
  }

  // Calculate total duration from all video lessons
  const totalDurationMinutes = useMemo(() => {
    return Math.ceil(
      modules
        .flatMap((m) => m.lessons)
        .filter((l) => l.content_type === 'video' && l.video_duration_seconds)
        .reduce((total, l) => total + (l.video_duration_seconds || 0), 0) / 60
    )
  }, [modules])

  const totalLessons = useMemo(() => modules.reduce((sum, m) => sum + m.lessons.length, 0), [modules])

  // Save course details
  const handleSaveCourse = async () => {
    setIsSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('courses')
        .update({
          title: courseForm.title,
          title_ar: courseForm.title_ar || null,
          description: courseForm.description || null,
          description_ar: courseForm.description_ar || null,
          short_description: courseForm.short_description || null,
          short_description_ar: courseForm.short_description_ar || null,
          category_id: courseForm.category_id,
          instructor_id: courseForm.instructor_id || null,
          difficulty_level: courseForm.difficulty_level as DifficultyLevel,
          price: parseFloat(courseForm.price) || 0,
          currency: courseForm.currency,
          is_free: courseForm.is_free,
          is_featured: courseForm.is_featured,
          certificate_enabled: courseForm.certificate_enabled,
          passing_score: parseInt(courseForm.passing_score) || 70,
          sequential_locking_enabled: courseForm.sequential_locking_enabled,
          status: courseForm.status,
          ...(courseForm.status === 'published' && !course.published_at
            ? { published_at: new Date().toISOString() }
            : {}),
        })
        .eq('id', course.id)

      if (error) throw error

      setIsEditing(false)
      router.refresh()
      toast.success('Course updated successfully')
    } catch (error) {
      console.error('Error saving course:', error)
      toast.error('Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  // Upload course thumbnail
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    setIsUploadingThumbnail(true)
    try {
      const supabase = createClient()
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const filePath = `courses/${course.id}/thumbnail.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('course-assets')
        .upload(filePath, file, { upsert: true, contentType: file.type })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('course-assets')
        .getPublicUrl(filePath)

      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`

      const { error: updateError } = await supabase
        .from('courses')
        .update({ thumbnail_url: urlData.publicUrl })
        .eq('id', course.id)

      if (updateError) throw updateError

      setThumbnailUrl(publicUrl)
      toast.success('Thumbnail uploaded successfully')
      router.refresh()
    } catch (error) {
      console.error('Error uploading thumbnail:', error)
      toast.error('Failed to upload thumbnail')
    } finally {
      setIsUploadingThumbnail(false)
      e.target.value = ''
    }
  }

  // Remove course thumbnail
  const handleThumbnailRemove = async () => {
    setIsUploadingThumbnail(true)
    try {
      const supabase = createClient()

      // Try to delete from storage (ignore errors if file doesn't exist)
      const { data: files } = await supabase.storage
        .from('course-assets')
        .list(`courses/${course.id}`)

      if (files) {
        const thumbnailFiles = files.filter((f) => f.name.startsWith('thumbnail'))
        if (thumbnailFiles.length > 0) {
          await supabase.storage
            .from('course-assets')
            .remove(thumbnailFiles.map((f) => `courses/${course.id}/${f.name}`))
        }
      }

      const { error } = await supabase
        .from('courses')
        .update({ thumbnail_url: null })
        .eq('id', course.id)

      if (error) throw error

      setThumbnailUrl(null)
      toast.success('Thumbnail removed')
      router.refresh()
    } catch (error) {
      console.error('Error removing thumbnail:', error)
      toast.error('Failed to remove thumbnail')
    } finally {
      setIsUploadingThumbnail(false)
    }
  }

  // Delete lesson
  const handleDeleteLesson = async (lessonId: string) => {
    setDeletingLessonId(lessonId)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('lessons').delete().eq('id', lessonId)

      if (error) throw error

      toast.success('Lesson deleted successfully')
      setDeleteConfirmation(null)
      refreshModules()
    } catch (error) {
      console.error('Error deleting lesson:', error)
      toast.error('Failed to delete lesson')
    } finally {
      setDeletingLessonId(null)
    }
  }

  // Handle drag end for lesson reorder within a module
  const handleDragEnd = async (event: DragEndEvent, moduleId: string) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setIsReordering(true)

    const mod = modules.find((m) => m.id === moduleId)
    if (!mod) { setIsReordering(false); return }

    const oldIndex = mod.lessons.findIndex((l) => l.id === active.id)
    const newIndex = mod.lessons.findIndex((l) => l.id === over.id)

    if (oldIndex === -1 || newIndex === -1) { setIsReordering(false); return }

    const reordered = arrayMove(mod.lessons, oldIndex, newIndex)

    // Optimistic update
    setModules((prev) =>
      prev.map((m) => (m.id === moduleId ? { ...m, lessons: reordered } : m))
    )

    try {
      const response = await fetch(`/api/admin/courses/${course.id}/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId,
          lessonIds: reordered.map((l) => l.id),
        }),
      })

      if (!response.ok) throw new Error('Failed to update order')
      toast.success('Lessons reordered')
    } catch (error) {
      console.error('Error reordering:', error)
      toast.error('Failed to reorder lessons')
      setModules(initialModules) // Revert
    } finally {
      setIsReordering(false)
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) return
      if (e.key !== 'Escape' && (showAddContent || showAddModule || editingLesson || previewLesson || deleteConfirmation)) return

      switch (e.key.toLowerCase()) {
        case 'n':
          if (activeTab === 'content') {
            e.preventDefault()
            setShowAddModule(true)
          }
          break
        case 'escape':
          e.preventDefault()
          if (showAddContent) setShowAddContent(null)
          if (showAddModule) setShowAddModule(false)
          if (editingLesson) setEditingLesson(null)
          if (previewLesson) setPreviewLesson(null)
          if (deleteConfirmation) setDeleteConfirmation(null)
          if (isEditing) setIsEditing(false)
          break
        case '?':
          e.preventDefault()
          toast.info('Keyboard Shortcuts', {
            description: 'N: Add module · Esc: Close dialogs · ?: This help',
            duration: 5000,
          })
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTab, showAddContent, showAddModule, editingLesson, previewLesson, deleteConfirmation, isEditing])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published': return <Badge variant="success">Published</Badge>
      case 'draft': return <Badge variant="secondary">Draft</Badge>
      case 'archived': return <Badge variant="warning">Archived</Badge>
      default: return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/${locale}/admin/courses`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Courses
          </Link>
          <button
            onClick={() => {
              toast.info('Keyboard Shortcuts', {
                description: 'N: Add module · Esc: Close dialogs · ?: This help',
                duration: 5000,
              })
            }}
            className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
            title="View keyboard shortcuts (or press ?)"
          >
            <span className="font-mono">?</span>
            <span className="hidden sm:inline">Shortcuts</span>
          </button>
        </div>
        <div className="flex items-center gap-3">
          {isEditing && (
            <button
              onClick={handleSaveCourse}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {isSaving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="h-4 w-4" /> Save Changes</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Course Header */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-3 flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{course.title}</h1>
              {getStatusBadge(course.status)}
            </div>
            {course.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
            )}
          </div>
        </div>

        {/* Course Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Modules</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{modules.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Lessons</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{totalLessons}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Duration</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {totalDurationMinutes > 0 ? `${totalDurationMinutes} min` : 'N/A'}
            </p>
            {totalDurationMinutes > 0 && (
              <p className="mt-0.5 text-xs text-muted-foreground">Auto-calculated from videos</p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Enrollments</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{course.enrollment_count}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-4 sm:space-x-6 overflow-x-auto" aria-label="Course editor tabs">
          {([
            { key: 'details' as TabType, label: 'Course Details' },
            { key: 'content' as TabType, label: `Content (${totalLessons})` },
            { key: 'quizzes' as TabType, label: 'Quizzes' },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`border-b-2 px-3 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
              }`}
              aria-selected={activeTab === tab.key}
              role="tab"
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ==================== DETAILS TAB ==================== */}
      {activeTab === 'details' && (
        <section className="space-y-6">
          {/* Designation Link Badge */}
          {course.designation_id && (
            <div className="flex items-center gap-3 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 dark:border-brand-800 dark:bg-brand-950">
              <BookOpen className="h-5 w-5 shrink-0 text-brand-600" />
              <p className="text-sm text-brand-700 dark:text-brand-300">
                This course is linked to a certification/designation. Video and content changes here will appear on the designation&apos;s Course Website tab.
              </p>
            </div>
          )}

          {/* Manage Videos Button — available for all courses */}
          <a
            href={`/${locale}/admin/courses/${course.id}/videos`}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
          >
            <Video className="h-4 w-4" />
            Manage Videos
          </a>

          {/* Course Thumbnail */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Course Thumbnail</h2>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              {/* Preview */}
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted sm:w-64">
                {thumbnailUrl ? (
                  <Image
                    src={thumbnailUrl}
                    alt={course.title}
                    fill
                    className="object-cover"
                    sizes="256px"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <ImagePlus className="mx-auto h-10 w-10" />
                      <p className="mt-2 text-sm">No thumbnail</p>
                    </div>
                  </div>
                )}
              </div>
              {/* Actions */}
              <div className="flex flex-col gap-2">
                <label
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted ${
                    isUploadingThumbnail ? 'pointer-events-none opacity-50' : ''
                  }`}
                >
                  {isUploadingThumbnail ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {isUploadingThumbnail ? 'Uploading...' : 'Upload Image'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailUpload}
                    className="hidden"
                    disabled={isUploadingThumbnail}
                  />
                </label>
                {thumbnailUrl && (
                  <button
                    onClick={handleThumbnailRemove}
                    disabled={isUploadingThumbnail}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                  >
                    <X className="h-4 w-4" />
                    Remove
                  </button>
                )}
                <p className="text-xs text-muted-foreground">
                  Recommended: 16:9 ratio, max 5MB. JPG, PNG, or WebP.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Course Information</h2>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
              >
                <Edit className="h-4 w-4" />
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {isEditing ? (
              <form className="grid gap-6 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); handleSaveCourse() }}>
                <div>
                  <label className="block text-sm font-medium text-foreground">Title (EN) *</label>
                  <input type="text" required value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">Title (AR)</label>
                  <input type="text" dir="rtl" value={courseForm.title_ar} onChange={(e) => setCourseForm({ ...courseForm, title_ar: e.target.value })} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-foreground">Description (EN)</label>
                  <textarea rows={3} value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-foreground">Description (AR)</label>
                  <textarea rows={3} dir="rtl" value={courseForm.description_ar} onChange={(e) => setCourseForm({ ...courseForm, description_ar: e.target.value })} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">Short Description (EN)</label>
                  <input type="text" value={courseForm.short_description} onChange={(e) => setCourseForm({ ...courseForm, short_description: e.target.value })} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">Short Description (AR)</label>
                  <input type="text" dir="rtl" value={courseForm.short_description_ar} onChange={(e) => setCourseForm({ ...courseForm, short_description_ar: e.target.value })} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">Category *</label>
                  <select value={courseForm.category_id} onChange={(e) => setCourseForm({ ...courseForm, category_id: e.target.value })} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">Instructor</label>
                  <select value={courseForm.instructor_id} onChange={(e) => setCourseForm({ ...courseForm, instructor_id: e.target.value })} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="">None</option>
                    {instructors.map((i) => <option key={i.id} value={i.id}>{i.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">Difficulty Level</label>
                  <select value={courseForm.difficulty_level} onChange={(e) => setCourseForm({ ...courseForm, difficulty_level: e.target.value as DifficultyLevel })} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">Status</label>
                  <select value={courseForm.status} onChange={(e) => setCourseForm({ ...courseForm, status: e.target.value as 'draft' | 'published' | 'archived' })} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">Price</label>
                  <div className="mt-1 flex gap-2">
                    <input type="number" min="0" step="0.01" value={courseForm.price} onChange={(e) => setCourseForm({ ...courseForm, price: e.target.value })} className="block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                    <select value={courseForm.currency} onChange={(e) => setCourseForm({ ...courseForm, currency: e.target.value })} className="w-24 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground">
                      <option value="USD">USD</option>
                      <option value="AED">AED</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">Passing Score (%)</label>
                  <input type="number" min="0" max="100" value={courseForm.passing_score} onChange={(e) => setCourseForm({ ...courseForm, passing_score: e.target.value })} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div className="sm:col-span-2 flex flex-wrap gap-6">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={courseForm.is_free} onChange={(e) => setCourseForm({ ...courseForm, is_free: e.target.checked })} className="h-4 w-4 rounded border-border text-primary" /> Free Course</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={courseForm.is_featured} onChange={(e) => setCourseForm({ ...courseForm, is_featured: e.target.checked })} className="h-4 w-4 rounded border-border text-primary" /> Featured</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={courseForm.certificate_enabled} onChange={(e) => setCourseForm({ ...courseForm, certificate_enabled: e.target.checked })} className="h-4 w-4 rounded border-border text-primary" /> Certificate Enabled</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={courseForm.sequential_locking_enabled} onChange={(e) => setCourseForm({ ...courseForm, sequential_locking_enabled: e.target.checked })} className="h-4 w-4 rounded border-border text-primary" /> Sequential Locking</label>
                </div>
              </form>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div><p className="text-xs text-muted-foreground">Title</p><p className="mt-0.5 text-sm text-foreground">{course.title}</p></div>
                <div><p className="text-xs text-muted-foreground">Title (AR)</p><p className="mt-0.5 text-sm text-foreground" dir="rtl">{course.title_ar || '—'}</p></div>
                <div><p className="text-xs text-muted-foreground">Category</p><p className="mt-0.5 text-sm text-foreground">{course.category?.name || '—'}</p></div>
                <div><p className="text-xs text-muted-foreground">Instructor</p><p className="mt-0.5 text-sm text-foreground">{course.instructor?.full_name || '—'}</p></div>
                <div><p className="text-xs text-muted-foreground">Difficulty</p><p className="mt-0.5 text-sm text-foreground capitalize">{course.difficulty_level || '—'}</p></div>
                <div><p className="text-xs text-muted-foreground">Price</p><p className="mt-0.5 text-sm text-foreground">{course.is_free ? 'Free' : `${course.price} ${course.currency}`}</p></div>
                <div><p className="text-xs text-muted-foreground">Passing Score</p><p className="mt-0.5 text-sm text-foreground">{course.passing_score}%</p></div>
                <div><p className="text-xs text-muted-foreground">Certificate</p><p className="mt-0.5 text-sm text-foreground">{course.certificate_enabled ? 'Enabled' : 'Disabled'}</p></div>
                <div><p className="text-xs text-muted-foreground">Sequential Locking</p><p className="mt-0.5 text-sm text-foreground">{course.sequential_locking_enabled ? 'Enabled' : 'Disabled'}</p></div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ==================== CONTENT TAB ==================== */}
      {activeTab === 'content' && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Organize your course into modules, then add lessons within each module
            </p>
            <button
              onClick={() => setShowAddModule(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Add Module
            </button>
          </div>

          {modules.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-12">
              <Upload className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">No modules yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Create a module first, then add videos, documents, or quizzes to it
              </p>
              <button
                onClick={() => setShowAddModule(true)}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                Add First Module
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {modules.map((mod) => (
                <section
                  key={mod.id}
                  className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
                >
                  {/* Module Header */}
                  <header
                    className={`bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 px-6 py-5 dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-blue-950/30 ${
                      collapsedModules.has(mod.id) ? '' : 'border-b border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => toggleModule(mod.id)}
                          className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg transition-transform hover:scale-105"
                          aria-expanded={!collapsedModules.has(mod.id)}
                          title={collapsedModules.has(mod.id) ? 'Expand module' : 'Collapse module'}
                        >
                          {collapsedModules.has(mod.id) ? (
                            <ChevronRight className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </button>
                        <button onClick={() => toggleModule(mod.id)} className="text-left">
                          <h3 className="text-lg font-bold text-foreground">{mod.title}</h3>
                          {mod.title_ar && <p className="text-sm text-muted-foreground" dir="rtl">{mod.title_ar}</p>}
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5">
                              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                              {mod.lessons.length} {mod.lessons.length === 1 ? 'lesson' : 'lessons'}
                            </span>
                            {(() => {
                              const dur = Math.ceil(
                                mod.lessons
                                  .filter((l) => l.content_type === 'video' && l.video_duration_seconds)
                                  .reduce((t, l) => t + (l.video_duration_seconds || 0), 0) / 60
                              )
                              return dur > 0 ? (
                                <>
                                  <span>·</span>
                                  <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{dur} min</span>
                                </>
                              ) : null
                            })()}
                            {(() => {
                              const req = mod.lessons.filter((l) => l.is_mandatory).length
                              return req > 0 ? (
                                <>
                                  <span>·</span>
                                  <span className="inline-flex items-center gap-1 font-medium text-orange-700 dark:text-orange-400">
                                    <Star className="h-3.5 w-3.5" />{req} required
                                  </span>
                                </>
                              ) : null
                            })()}
                          </div>
                        </button>
                      </div>
                      <button
                        onClick={() => setShowAddContent(mod.id)}
                        className="inline-flex items-center gap-2 rounded-lg bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm ring-1 ring-border transition-all hover:bg-muted hover:shadow-md"
                      >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Add Lesson</span>
                        <span className="sm:hidden">Add</span>
                      </button>
                    </div>
                  </header>

                  {/* Module Content (collapsible) */}
                  {!collapsedModules.has(mod.id) && (
                    <div className="relative">
                      {mod.lessons.length === 0 ? (
                        <div className="flex flex-col items-center py-8 text-muted-foreground">
                          <p className="text-sm">No lessons in this module yet</p>
                          <button
                            onClick={() => setShowAddContent(mod.id)}
                            className="mt-2 text-sm font-medium text-primary hover:underline"
                          >
                            Add first lesson
                          </button>
                        </div>
                      ) : (
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={(event) => handleDragEnd(event, mod.id)}
                        >
                          <SortableContext
                            items={mod.lessons.map((l) => l.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="grid gap-4 p-6">
                              {isReordering && (
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
                                  courseId={course.id}
                                  onPreview={setPreviewLesson}
                                  onEdit={setEditingLesson}
                                  onDelete={(id, title, type) => setDeleteConfirmation({ id, title, type })}
                                  onVideoUploaded={refreshModules}
                                  isDeleting={deletingLessonId === lesson.id}
                                />
                              ))}
                            </div>
                          </SortableContext>
                        </DndContext>
                      )}
                    </div>
                  )}
                </section>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ==================== QUIZZES TAB ==================== */}
      {activeTab === 'quizzes' && (
        <section className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Course Quizzes</h2>
              <Link
                href={`/${locale}/admin/courses/${course.id}/quizzes`}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
              >
                <ClipboardList className="h-4 w-4" />
                Manage Quizzes
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              Create and manage quizzes for this course from the dedicated quizzes page.
            </p>
          </div>
        </section>
      )}

      {/* ==================== DIALOGS ==================== */}

      {/* Add Module Dialog */}
      {showAddModule && (
        <AddModuleDialog
          courseId={course.id}
          existingModuleCount={modules.length}
          onClose={() => setShowAddModule(false)}
          onSuccess={() => {
            setShowAddModule(false)
            refreshModules()
          }}
        />
      )}

      {/* Add Content Dialog */}
      {showAddContent && (
        <AddContentDialog
          courseId={course.id}
          moduleId={showAddContent}
          existingLessonCount={modules.find((m) => m.id === showAddContent)?.lessons.length || 0}
          onClose={() => setShowAddContent(null)}
          onSuccess={() => {
            setShowAddContent(null)
            refreshModules()
          }}
        />
      )}

      {/* Edit Content Dialog */}
      {editingLesson && (
        <EditContentDialog
          lesson={editingLesson}
          onClose={() => setEditingLesson(null)}
          onSuccess={() => {
            setEditingLesson(null)
            refreshModules()
          }}
        />
      )}

      {/* Video Preview Modal */}
      {previewLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-4xl rounded-lg bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">{previewLesson.title}</h3>
              <button
                onClick={() => setPreviewLesson(null)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
                aria-label="Close preview"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {previewLesson.content_type === 'video' && previewLesson.video_url ? (
              <VideoPreview src={previewLesson.video_url} />
            ) : previewLesson.content_type === 'document' && previewLesson.document_url ? (
              <div className="w-full overflow-hidden rounded-lg bg-slate-900" style={{ height: '600px' }}>
                <iframe src={previewLesson.document_url} className="h-full w-full" title="Document Preview" />
              </div>
            ) : (
              <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-slate-900 text-slate-400">
                No preview available
              </div>
            )}
            <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
              {previewLesson.video_duration_seconds && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {Math.floor(previewLesson.video_duration_seconds / 60)}:{(previewLesson.video_duration_seconds % 60).toString().padStart(2, '0')}
                </span>
              )}
              <span className="capitalize">{previewLesson.content_type}</span>
              {previewLesson.is_mandatory && (
                <span className="rounded bg-orange-100 px-2 py-1 text-orange-800 dark:bg-orange-900 dark:text-orange-200">Required</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmation} onOpenChange={() => setDeleteConfirmation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <Trash2 className="h-5 w-5" />
              Delete {deleteConfirmation?.type}?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p className="text-base font-semibold text-foreground">
                &ldquo;{deleteConfirmation?.title}&rdquo;
              </p>
              <p className="text-muted-foreground">
                This will permanently delete this lesson. Learners will lose access.
              </p>
              <p className="flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400">
                This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirmation) handleDeleteLesson(deleteConfirmation.id)
              }}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete Lesson
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
