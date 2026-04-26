'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'
import { Toaster } from 'sonner'
import type { Category, DifficultyLevel } from '@/types'

export function CreateCourseForm() {
  const router = useRouter()
  const locale = useLocale()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [instructors, setInstructors] = useState<{ id: string; full_name: string }[]>([])
  // Tracks whether the slug has been edited by the user; once true, we stop
  // overwriting it from the title.
  const [slugTouched, setSlugTouched] = useState(false)

  const [form, setForm] = useState({
    title: '',
    title_ar: '',
    slug: '',
    description: '',
    description_ar: '',
    short_description: '',
    short_description_ar: '',
    category_id: '',
    instructor_id: '',
    difficulty_level: 'beginner' as string,
    price: '0',
    currency: 'USD',
    is_free: true,
    is_featured: false,
    certificate_enabled: true,
    passing_score: '70',
    sequential_locking_enabled: false,
  })

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()

      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      const { data: insts } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('role', ['super_admin', 'instructor'])
        .eq('is_active', true)

      if (cats) setCategories(cats as Category[])
      if (insts) setInstructors(insts)
      if (cats && cats.length > 0) {
        setForm((prev) => ({ ...prev, category_id: cats[0].id }))
      }
    }
    fetchData()
  }, [])

  // Auto-generate slug from the English title — but only while the user
  // hasn't manually edited the slug field. If they clear the EN title we
  // leave the slug as-is so they can submit Arabic-only courses without
  // re-typing.
  useEffect(() => {
    if (slugTouched) return
    if (!form.title) return
    const slug = form.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
    setForm((prev) => ({ ...prev, slug }))
  }, [form.title, slugTouched])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const hasEn = form.title.trim().length > 0
    const hasAr = form.title_ar.trim().length > 0

    if (!hasEn && !hasAr) {
      toast.error(
        'Provide a course title in English or Arabic — at least one is required'
      )
      return
    }
    if (!form.slug.trim()) {
      toast.error('Slug is required (auto-generated from English title; type one manually for Arabic-only courses)')
      return
    }
    if (!form.category_id) {
      toast.error('Category is required')
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('courses')
        .insert({
          title: form.title.trim() || null,
          title_ar: form.title_ar.trim() || null,
          slug: form.slug.trim(),
          description: form.description.trim() || null,
          description_ar: form.description_ar.trim() || null,
          short_description: form.short_description.trim() || null,
          short_description_ar: form.short_description_ar.trim() || null,
          category_id: form.category_id,
          instructor_id: form.instructor_id || null,
          difficulty_level: form.difficulty_level as DifficultyLevel,
          price: parseFloat(form.price) || 0,
          currency: form.currency,
          is_free: form.is_free,
          is_featured: form.is_featured,
          certificate_enabled: form.certificate_enabled,
          passing_score: parseInt(form.passing_score) || 70,
          sequential_locking_enabled: form.sequential_locking_enabled,
          status: 'draft',
        })
        .select('id')
        .single()

      if (error) throw error

      toast.success('Course created! Redirecting to editor...')
      router.push(`/${locale}/admin/courses/${data.id}/edit`)
    } catch (error: unknown) {
      console.error('Error creating course:', error)
      const msg = error instanceof Error ? error.message : 'Failed to create course'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="mx-auto max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-border bg-card p-6">
          {/* Title — at least one of EN/AR required */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Course title</span> — fill in the language(s) you want this course to appear in. At least one is required. Arabic-only courses will only appear on the Arabic catalog; English-only on the English catalog.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground">Course Title (English)</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., Introduction to Risk Management"
                  className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Course Title (Arabic)</label>
                <input
                  type="text"
                  dir="rtl"
                  value={form.title_ar}
                  onChange={(e) => setForm({ ...form, title_ar: e.target.value })}
                  placeholder="مقدمة لإدارة المخاطر"
                  className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-foreground">URL Slug *</label>
            <input
              type="text"
              required
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true)
                setForm({ ...form, slug: e.target.value })
              }}
              className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <p className="mt-1 text-xs text-muted-foreground">Auto-generated from title. Must be unique.</p>
          </div>

          {/* Description */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground">Description (English)</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Description (Arabic)</label>
              <textarea
                rows={3}
                dir="rtl"
                value={form.description_ar}
                onChange={(e) => setForm({ ...form, description_ar: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Category & Instructor */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground">Category *</label>
              <select
                required
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select category...</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Instructor</label>
              <select
                value={form.instructor_id}
                onChange={(e) => setForm({ ...form, instructor_id: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">None</option>
                {instructors.map((i) => <option key={i.id} value={i.id}>{i.full_name}</option>)}
              </select>
            </div>
          </div>

          {/* Difficulty & Price */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-foreground">Difficulty Level</label>
              <select
                value={form.difficulty_level}
                onChange={(e) => setForm({ ...form, difficulty_level: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Passing Score (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.passing_score}
                onChange={(e) => setForm({ ...form, passing_score: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_free} onChange={(e) => setForm({ ...form, is_free: e.target.checked })} className="h-4 w-4 rounded border-border text-primary" />
              Free Course
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.certificate_enabled} onChange={(e) => setForm({ ...form, certificate_enabled: e.target.checked })} className="h-4 w-4 rounded border-border text-primary" />
              Certificate Enabled
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.sequential_locking_enabled} onChange={(e) => setForm({ ...form, sequential_locking_enabled: e.target.checked })} className="h-4 w-4 rounded border-border text-primary" />
              Sequential Locking
            </label>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 border-t border-border pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</>
              ) : (
                <><Save className="h-4 w-4" /> Create Course</>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
