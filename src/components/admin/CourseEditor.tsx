'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLocale } from 'next-intl'
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
  BookOpen,
  Video,
  AlertTriangle,
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
import { DraggableModuleSection } from './DraggableModuleSection'
import { AddModuleDialog } from './AddModuleDialog'
import { AddContentDialog } from './AddContentDialog'
import { BulkUploadVideosDialog } from './BulkUploadVideosDialog'
import { EditContentDialog } from './EditContentDialog'
import { VideoPreview } from './VideoPreview'
import type { Course, Module, Lesson, Category, DifficultyLevel } from '@/types'

interface CourseEditorProps {
  course: Course
  modules: (Module & { lessons: Lesson[] })[]
  categories: Category[]
  instructors: { id: string; full_name: string }[]
}

type TabType = 'details' | 'content' | 'quizzes' | 'survey'

export function CourseEditor({ course, modules: initialModules, categories, instructors }: CourseEditorProps) {
  const router = useRouter()
  const locale = useLocale()
  const [activeTab, setActiveTab] = useState<TabType>('content')
  const [isEditing, setIsEditing] = useState(false)
  const [showAddContent, setShowAddContent] = useState<string | null>(null) // moduleId
  const [showBulkUpload, setShowBulkUpload] = useState<string | null>(null) // moduleId
  const [showAddModule, setShowAddModule] = useState(false)
  const [previewLesson, setPreviewLesson] = useState<Lesson | null>(null)
  const [previewVideoSrc, setPreviewVideoSrc] = useState<string | null>(null)
  const [isResolvingPreview, setIsResolvingPreview] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [deletingLessonId, setDeletingLessonId] = useState<string | null>(null)
  const [modules, setModules] = useState(initialModules)
  const [isReordering, setIsReordering] = useState(false)
  const [isReorderingModules, setIsReorderingModules] = useState(false)
  const [collapsedModules, setCollapsedModules] = useState<Set<string>>(new Set())
  const [isSaving, setIsSaving] = useState(false)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(course.thumbnail_url || null)
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false)

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    id: string
    title: string
    type: string
  } | null>(null)

  const [selectedLessonIds, setSelectedLessonIds] = useState<Set<string>>(new Set())
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  const [deleteModuleConfirmation, setDeleteModuleConfirmation] = useState<{
    id: string
    title: string
    lessonCount: number
  } | null>(null)
  const [deletingModuleId, setDeletingModuleId] = useState<string | null>(null)

  const [courseForm, setCourseForm] = useState({
    title: course.title ?? '',
    title_ar: course.title_ar || '',
    description: course.description || '',
    description_ar: course.description_ar || '',
    short_description: course.short_description || '',
    short_description_ar: course.short_description_ar || '',
    category_id: course.category_id,
    instructor_id: course.instructor_id || '',
    difficulty_level: course.difficulty_level || 'gateway',
    tier_level: (course as { tier_level?: string | null }).tier_level ?? '',
    price: course.price?.toString() || '0',
    currency: course.currency || 'USD',
    is_free: course.is_free,
    is_featured: course.is_featured,
    certificate_enabled: course.certificate_enabled,
    passing_score: course.passing_score?.toString() || '70',
    require_knowledge_checks:
      (course as { require_knowledge_checks?: boolean | null })
        .require_knowledge_checks ?? true,
    sequential_locking_enabled: course.sequential_locking_enabled ?? false,
    badge_template_external_id:
      (course as { badge_template_external_id?: string | null })
        .badge_template_external_id ?? '',
    certificate_template_id:
      (course as { certificate_template_id?: string | null })
        .certificate_template_id ?? '',
    status: course.status,
  })

  // Certificate templates for the per-course picker. Empty selection = use the
  // system Default (the certificate generator falls back to is_default).
  const [certificateTemplates, setCertificateTemplates] = useState<
    { id: string; name: string; is_default: boolean }[]
  >([])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('certificate_templates')
      .select('id, name, is_default')
      .order('name')
      .then(({ data }) => {
        if (data) setCertificateTemplates(data as typeof certificateTemplates)
      })
  }, [])

  // (Badge template picker removed — templates are now auto-resolved by
  // the backend per course via the 'AUTO' sentinel in
  // courses.badge_template_external_id. See lessons/[lessonId]/complete.)

  // Local mirror of the persisted status — kept in sync after every save so
  // the publish-guard doesn't read stale `course.status` from props.
  const [persistedStatus, setPersistedStatus] = useState(course.status)

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Update modules when prop changes
  useEffect(() => {
    setModules(initialModules)
  }, [initialModules])

  // Resolve preview video src (signed URL for private bucket)
  useEffect(() => {
    if (!previewLesson || previewLesson.content_type !== 'video' || !previewLesson.video_url) {
      setPreviewVideoSrc(null)
      setPreviewError(null)
      setIsResolvingPreview(false)
      return
    }

    const raw = previewLesson.video_url
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      setPreviewVideoSrc(raw)
      setPreviewError(null)
      setIsResolvingPreview(false)
      return
    }

    let cancelled = false
    setIsResolvingPreview(true)
    setPreviewError(null)
    setPreviewVideoSrc(null)

    fetch('/api/video/signed-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId: previewLesson.id }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || 'Failed to load video')
        return data.url as string
      })
      .then((url) => {
        if (!cancelled) setPreviewVideoSrc(url)
      })
      .catch((err) => {
        if (!cancelled) setPreviewError(err instanceof Error ? err.message : 'Failed to load video')
      })
      .finally(() => {
        if (!cancelled) setIsResolvingPreview(false)
      })

    return () => {
      cancelled = true
    }
  }, [previewLesson])

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

  // Validation — what's blocking this course from going live?
  const validationIssues = useMemo(() => {
    const issues: { level: 'error' | 'warning'; message: string }[] = []

    if (modules.length === 0) {
      issues.push({ level: 'error', message: 'Add at least one module to organize lessons.' })
    }
    if (totalLessons === 0) {
      issues.push({ level: 'error', message: 'Add at least one lesson the course is currently empty.' })
    }

    // Modules with zero lessons
    const emptyModules = modules.filter((m) => m.lessons.length === 0)
    if (emptyModules.length > 0) {
      issues.push({
        level: 'warning',
        message: `${emptyModules.length} module${emptyModules.length === 1 ? '' : 's'} have no lessons (${emptyModules.map((m) => m.title || m.title_ar || 'Untitled').slice(0, 3).join(', ')}${emptyModules.length > 3 ? '…' : ''}).`,
      })
    }

    // Video lessons with no video uploaded
    const videoLessons = modules.flatMap((m) => m.lessons).filter((l) => l.content_type === 'video')
    const missingVideos = videoLessons.filter((l) => !l.video_url)
    if (missingVideos.length > 0) {
      issues.push({
        level: 'warning',
        message: `${missingVideos.length} of ${videoLessons.length} video lesson${videoLessons.length === 1 ? '' : 's'} have no video file uploaded yet.`,
      })
    }

    // Document lessons with no file
    const docLessons = modules.flatMap((m) => m.lessons).filter((l) => l.content_type === 'document')
    const missingDocs = docLessons.filter((l) => !l.document_url)
    if (missingDocs.length > 0) {
      issues.push({
        level: 'warning',
        message: `${missingDocs.length} document lesson${missingDocs.length === 1 ? '' : 's'} have no file attached.`,
      })
    }

    return issues
  }, [modules, totalLessons])

  const blockingIssues = validationIssues.filter((i) => i.level === 'error')
  const canPublish = blockingIssues.length === 0

  // Save course details
  const handleSaveCourse = async () => {
    const hasEn = (courseForm.title ?? '').trim().length > 0
    const hasAr = (courseForm.title_ar ?? '').trim().length > 0
    if (!hasEn && !hasAr) {
      toast.error('Provide a course title in English or Arabic at least one is required')
      return
    }
    // Block publishing an incomplete course
    if (courseForm.status === 'published' && persistedStatus !== 'published' && !canPublish) {
      toast.error('Cannot publish fix the blocking issues listed at the top of the page first.')
      return
    }
    setIsSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('courses')
        .update({
          title: courseForm.title?.trim() || null,
          title_ar: courseForm.title_ar?.trim() || null,
          description: courseForm.description?.trim() || null,
          description_ar: courseForm.description_ar?.trim() || null,
          short_description: courseForm.short_description?.trim() || null,
          short_description_ar: courseForm.short_description_ar?.trim() || null,
          category_id: courseForm.category_id,
          instructor_id: courseForm.instructor_id || null,
          difficulty_level: courseForm.difficulty_level as DifficultyLevel,
          tier_level: courseForm.tier_level || null,
          price: parseFloat(courseForm.price) || 0,
          currency: courseForm.currency,
          is_free: courseForm.is_free,
          is_featured: courseForm.is_featured,
          certificate_enabled: courseForm.certificate_enabled,
          certificate_template_id: courseForm.certificate_template_id || null,
          passing_score: parseInt(courseForm.passing_score) || 70,
          require_knowledge_checks: courseForm.require_knowledge_checks,
          sequential_locking_enabled: courseForm.sequential_locking_enabled,
          badge_template_external_id:
            courseForm.badge_template_external_id || null,
          status: courseForm.status,
          ...(courseForm.status === 'published' && !course.published_at
            ? { published_at: new Date().toISOString() }
            : {}),
        })
        .eq('id', course.id)

      if (error) throw error

      setIsEditing(false)
      setPersistedStatus(courseForm.status)
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
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`/api/admin/courses/${course.id}/thumbnail`, {
        method: 'POST',
        body: formData,
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json?.error || 'Upload failed')
      }

      // Server already returns a cache-busted URL (?v=<timestamp>) — use it
      // as-is. Appending another `?t=…` would produce a malformed URL.
      setThumbnailUrl(json.thumbnail_url)
      toast.success('Thumbnail uploaded successfully')
      router.refresh()
    } catch (error) {
      console.error('Error uploading thumbnail:', error)
      const message = error instanceof Error ? error.message : 'Failed to upload thumbnail'
      toast.error(message)
    } finally {
      setIsUploadingThumbnail(false)
      e.target.value = ''
    }
  }

  // Remove course thumbnail
  const handleThumbnailRemove = async () => {
    setIsUploadingThumbnail(true)
    try {
      const res = await fetch(`/api/admin/courses/${course.id}/thumbnail`, {
        method: 'DELETE',
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json?.error || 'Remove failed')
      }

      setThumbnailUrl(null)
      toast.success('Thumbnail removed')
      router.refresh()
    } catch (error) {
      console.error('Error removing thumbnail:', error)
      const message = error instanceof Error ? error.message : 'Failed to remove thumbnail'
      toast.error(message)
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
      setSelectedLessonIds((prev) => {
        const next = new Set(prev)
        next.delete(lessonId)
        return next
      })
      refreshModules()
    } catch (error) {
      console.error('Error deleting lesson:', error)
      toast.error('Failed to delete lesson')
    } finally {
      setDeletingLessonId(null)
    }
  }

  // Bulk lesson selection helpers
  const handleLessonSelectChange = (lessonId: string, checked: boolean) => {
    setSelectedLessonIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(lessonId)
      else next.delete(lessonId)
      return next
    })
  }

  const handleToggleAllInModule = (_moduleId: string, lessonIds: string[]) => {
    setSelectedLessonIds((prev) => {
      const next = new Set(prev)
      const allSelected = lessonIds.every((id) => next.has(id))
      if (allSelected) {
        for (const id of lessonIds) next.delete(id)
      } else {
        for (const id of lessonIds) next.add(id)
      }
      return next
    })
  }

  const clearSelection = () => setSelectedLessonIds(new Set())

  const handleBulkDeleteLessons = async () => {
    const ids = Array.from(selectedLessonIds)
    if (ids.length === 0) return
    setIsBulkDeleting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('lessons').delete().in('id', ids)
      if (error) throw error
      toast.success(`Deleted ${ids.length} lesson${ids.length === 1 ? '' : 's'}`)
      setBulkDeleteOpen(false)
      clearSelection()
      refreshModules()
    } catch (error) {
      console.error('Error bulk deleting lessons:', error)
      toast.error('Failed to delete lessons')
    } finally {
      setIsBulkDeleting(false)
    }
  }

  // Delete module (cascades to lessons via FK)
  const handleDeleteModule = async (moduleId: string) => {
    setDeletingModuleId(moduleId)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('modules').delete().eq('id', moduleId)

      if (error) throw error

      toast.success('Module deleted successfully')
      setDeleteModuleConfirmation(null)
      refreshModules()
    } catch (error) {
      console.error('Error deleting module:', error)
      toast.error('Failed to delete module')
    } finally {
      setDeletingModuleId(null)
    }
  }

  // Handle drag end for module reorder within a course
  const handleModuleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = modules.findIndex((m) => m.id === active.id)
    const newIndex = modules.findIndex((m) => m.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(modules, oldIndex, newIndex)
    const previous = modules

    setIsReorderingModules(true)
    setModules(reordered)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Not authenticated')

      const response = await fetch(`/api/admin/courses/${course.id}/reorder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ moduleIds: reordered.map((m) => m.id) }),
      })

      if (!response.ok) throw new Error('Failed to update module order')
      toast.success('Modules reordered')
    } catch (error) {
      console.error('Error reordering modules:', error)
      toast.error('Failed to reorder modules')
      setModules(previous) // Revert
    } finally {
      setIsReorderingModules(false)
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
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Not authenticated')

      const response = await fetch(`/api/admin/courses/${course.id}/reorder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
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
      if (e.key !== 'Escape' && (showAddContent || showAddModule || editingLesson || previewLesson || deleteConfirmation || deleteModuleConfirmation)) return

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
  }, [activeTab, showAddContent, showAddModule, editingLesson, previewLesson, deleteConfirmation, deleteModuleConfirmation, isEditing])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published': return <Badge variant="success">Published</Badge>
      case 'draft': return <Badge variant="secondary">Draft</Badge>
      case 'archived': return <Badge variant="warning">Archived</Badge>
      default: return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="mx-auto space-y-6 p-4 sm:p-6">
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

      {/* Validation banner — surfaces issues that block publishing */}
      {validationIssues.length > 0 && (
        <div
          className={`rounded-lg border p-4 ${
            blockingIssues.length > 0
              ? 'border-red-300 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20'
              : 'border-amber-300 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20'
          }`}
          role="alert"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              className={`h-5 w-5 shrink-0 mt-0.5 ${
                blockingIssues.length > 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            />
            <div className="min-w-0 flex-1">
              <p
                className={`text-sm font-semibold ${
                  blockingIssues.length > 0
                    ? 'text-red-900 dark:text-red-100'
                    : 'text-amber-900 dark:text-amber-100'
                }`}
              >
                {blockingIssues.length > 0
                  ? `Course is incomplete fix ${blockingIssues.length} issue${blockingIssues.length === 1 ? '' : 's'} before publishing`
                  : 'Course has missing content review before publishing'}
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                {validationIssues.map((issue, i) => (
                  <li
                    key={i}
                    className={
                      issue.level === 'error'
                        ? 'text-red-800 dark:text-red-200'
                        : 'text-amber-800 dark:text-amber-200'
                    }
                  >
                    <span className="font-mono mr-2">
                      {issue.level === 'error' ? '✗' : '!'}
                    </span>
                    {issue.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Course Header */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-3 flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">
                {locale === 'ar'
                  ? course.title_ar || course.title || '—'
                  : course.title || course.title_ar || '—'}
              </h1>
              {getStatusBadge(course.status)}
            </div>
            {(locale === 'ar'
              ? course.description_ar || course.description
              : course.description || course.description_ar) && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {locale === 'ar'
                  ? course.description_ar || course.description
                  : course.description || course.description_ar}
              </p>
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
            { key: 'survey' as TabType, label: 'Survey' },
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
                    alt={course.title ?? course.title_ar ?? "Course thumbnail"}
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
                <div className="sm:col-span-2 -mb-3">
                  <p className="text-xs text-muted-foreground">
                    Fill in at least one title EN-only courses appear on the
                    English catalog, AR-only on the Arabic one, both = both.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">Title (EN)</label>
                  <input type="text" value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
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
                    <option value="gateway">Gateway</option>
                    <option value="professional">Professional</option>
                    <option value="executive">Executive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">Tier</label>
                  <select value={courseForm.tier_level} onChange={(e) => setCourseForm({ ...courseForm, tier_level: e.target.value })} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value=""> Untiered </option>
                    <option value="gateway">Gateway</option>
                    <option value="professional">Professional</option>
                    <option value="executive">Executive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">Status</label>
                  <select value={courseForm.status} onChange={(e) => setCourseForm({ ...courseForm, status: e.target.value as 'draft' | 'published' | 'archived' })} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="draft">Draft</option>
                    <option value="published" disabled={!canPublish && persistedStatus !== 'published'}>
                      Published{!canPublish && persistedStatus !== 'published' ? ' (fix issues above to enable)' : ''}
                    </option>
                    <option value="archived">Archived</option>
                  </select>
                  {!canPublish && persistedStatus !== 'published' && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      Add at least one module and one lesson before publishing.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">Certificate Template</label>
                  <select value={courseForm.certificate_template_id} onChange={(e) => setCourseForm({ ...courseForm, certificate_template_id: e.target.value })} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="">Default (system template)</option>
                    {certificateTemplates.map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.name}{tpl.is_default ? ' (default)' : ''}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-muted-foreground">Leave on Default to use the system default template.</p>
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
                  <p className="mt-1 text-xs text-muted-foreground">Aggregate pass mark across all knowledge checks in this course.</p>
                </div>
                <div className="sm:col-span-2">
                  <label className="flex items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={courseForm.require_knowledge_checks}
                      onChange={(e) => setCourseForm({ ...courseForm, require_knowledge_checks: e.target.checked })}
                      className="mt-0.5 h-4 w-4 rounded border-border text-primary"
                    />
                    <span>
                      Require knowledge checks for the certificate
                      <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                        The learner must attempt every published knowledge check and reach the passing score above before the certificate is issued. Has no effect on courses without knowledge checks.
                      </span>
                    </span>
                  </label>
                </div>
                <div className="sm:col-span-2">
                  <label className="flex items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={courseForm.badge_template_external_id !== ''}
                      onChange={(e) => setCourseForm({
                        ...courseForm,
                        // 'AUTO' sentinel — backend resolves to an existing
                        // template by external_id 'course:{id}', or creates
                        // one with sensible defaults on first completion.
                        badge_template_external_id: e.target.checked ? 'AUTO' : '',
                      })}
                      className="mt-0.5 h-4 w-4 rounded border-border text-primary"
                    />
                    <span>
                      <span className="block font-medium text-foreground">Issue badge on completion</span>
                      <span className="block text-xs text-muted-foreground">
                        Auto-creates a badge template named after this course on the badges service the first time a learner completes it, and reuses it for everyone after. Uncheck to disable badges for this course.
                      </span>
                    </span>
                  </label>

                </div>
                <div className="sm:col-span-2 flex flex-wrap gap-6">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={courseForm.is_free} onChange={(e) => setCourseForm({ ...courseForm, is_free: e.target.checked })} className="h-4 w-4 rounded border-border text-primary" /> Free Course</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={courseForm.is_featured} onChange={(e) => setCourseForm({ ...courseForm, is_featured: e.target.checked })} className="h-4 w-4 rounded border-border text-primary" /> Featured</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={courseForm.certificate_enabled} onChange={(e) => setCourseForm({ ...courseForm, certificate_enabled: e.target.checked })} className="h-4 w-4 rounded border-border text-primary" /> Certificate Enabled</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!courseForm.badge_template_external_id} onChange={(e) => setCourseForm({ ...courseForm, badge_template_external_id: e.target.checked ? (courseForm.badge_template_external_id || 'AUTO') : '' })} className="h-4 w-4 rounded border-border text-primary" /> Issue Badge on Completion</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={courseForm.sequential_locking_enabled} onChange={(e) => setCourseForm({ ...courseForm, sequential_locking_enabled: e.target.checked })} className="h-4 w-4 rounded border-border text-primary" /> Sequential Locking</label>
                </div>
              </form>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div><p className="text-xs text-muted-foreground">Title</p><p className="mt-0.5 text-sm text-foreground">{course.title}</p></div>
                <div><p className="text-xs text-muted-foreground">Title (AR)</p><p className="mt-0.5 text-sm text-foreground" dir="rtl">{course.title_ar || '—'}</p></div>
                <div><p className="text-xs text-muted-foreground">Category</p><p className="mt-0.5 text-sm text-foreground">{course.category?.name || '—'}</p></div>
                <div><p className="text-xs text-muted-foreground">Instructor</p><p className="mt-0.5 text-sm text-foreground">{course.instructor?.full_name || '—'}</p></div>
                <div><p className="text-xs text-muted-foreground">Difficulty</p><p className="mt-0.5 text-sm text-foreground">{course.difficulty_level ? ({ gateway: 'Gateway', professional: 'Professional', executive: 'Executive', expert: 'Expert' }[course.difficulty_level] ?? course.difficulty_level) : '—'}</p></div>
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleModuleDragEnd}
            >
              <SortableContext
                items={modules.map((m) => m.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="relative space-y-8">
                  {isReorderingModules && (
                    <div className="absolute inset-0 z-50 flex items-start justify-center pt-4">
                      <div className="flex items-center gap-2 rounded-lg bg-card px-4 py-2 shadow-lg">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-sm font-medium">Updating module order...</span>
                      </div>
                    </div>
                  )}
                  {modules.map((mod) => (
                    <DraggableModuleSection
                      key={mod.id}
                      module={mod}
                      courseId={course.id}
                      isCollapsed={collapsedModules.has(mod.id)}
                      isReorderingLessons={isReordering}
                      isDeleting={deletingModuleId === mod.id}
                      deletingLessonId={deletingLessonId}
                      onToggle={toggleModule}
                      onAddLesson={(moduleId) => setShowAddContent(moduleId)}
                      onBulkUpload={(moduleId) => setShowBulkUpload(moduleId)}
                      onDeleteModule={(id, title, lessonCount) =>
                        setDeleteModuleConfirmation({ id, title, lessonCount })
                      }
                      onLessonDragEnd={handleDragEnd}
                      onLessonPreview={setPreviewLesson}
                      onLessonEdit={setEditingLesson}
                      onLessonDelete={(id, title, type) =>
                        setDeleteConfirmation({ id, title, type })
                      }
                      onVideoUploaded={refreshModules}
                      selectedLessonIds={selectedLessonIds}
                      onLessonSelectChange={handleLessonSelectChange}
                      onToggleAllInModule={handleToggleAllInModule}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
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

      {activeTab === 'survey' && (
        <section className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Course Survey</h2>
              <Link
                href={`/${locale}/admin/courses/${course.id}/surveys`}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
              >
                <ClipboardList className="h-4 w-4" />
                Manage Survey
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              Shown to learners after course completion. When marked required, blocks the certificate and badge until submitted.
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

      {/* Bulk Upload Videos Dialog */}
      {showBulkUpload && (
        <BulkUploadVideosDialog
          courseId={course.id}
          moduleId={showBulkUpload}
          existingLessonCount={modules.find((m) => m.id === showBulkUpload)?.lessons.length || 0}
          onClose={() => setShowBulkUpload(null)}
          onSuccess={() => {
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
              isResolvingPreview ? (
                <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-slate-900 text-slate-300">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : previewError ? (
                <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-slate-900 px-6 text-center text-sm text-red-300">
                  {previewError}
                </div>
              ) : previewVideoSrc ? (
                <VideoPreview src={previewVideoSrc} />
              ) : (
                <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-slate-900 text-slate-400">
                  No preview available
                </div>
              )
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

      {/* Floating bulk-action bar */}
      {selectedLessonIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2">
          <div className="flex items-center gap-3 rounded-full border border-border bg-card px-4 py-2 shadow-lg">
            <span className="text-sm font-medium">
              {selectedLessonIds.size} lesson{selectedLessonIds.size === 1 ? '' : 's'} selected
            </span>
            <span className="h-5 w-px bg-border" />
            <button
              onClick={clearSelection}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => setBulkDeleteOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete selected
            </button>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={(open) => !isBulkDeleting && setBulkDeleteOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <Trash2 className="h-5 w-5" />
              Delete {selectedLessonIds.size} lesson{selectedLessonIds.size === 1 ? '' : 's'}?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p className="text-muted-foreground">
                This will permanently delete the selected lessons across all modules. Learners will lose access immediately.
              </p>
              <p className="flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400">
                This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleBulkDeleteLessons()
              }}
              disabled={isBulkDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isBulkDeleting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </span>
              ) : (
                `Delete ${selectedLessonIds.size} lesson${selectedLessonIds.size === 1 ? '' : 's'}`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

      {/* Delete Module Confirmation */}
      <AlertDialog open={!!deleteModuleConfirmation} onOpenChange={() => setDeleteModuleConfirmation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <Trash2 className="h-5 w-5" />
              Delete module?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p className="text-base font-semibold text-foreground">
                &ldquo;{deleteModuleConfirmation?.title}&rdquo;
              </p>
              <p className="text-muted-foreground">
                {deleteModuleConfirmation && deleteModuleConfirmation.lessonCount > 0
                  ? `This will permanently delete this module and all ${deleteModuleConfirmation.lessonCount} ${deleteModuleConfirmation.lessonCount === 1 ? 'lesson' : 'lessons'} inside it. Learner progress for these lessons will be lost.`
                  : 'This will permanently delete this module.'}
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
                if (deleteModuleConfirmation) handleDeleteModule(deleteModuleConfirmation.id)
              }}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete Module
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
