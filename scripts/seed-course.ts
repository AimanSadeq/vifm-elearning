/**
 * Seed a course into the database from JSON content files.
 * Creates course, modules, and lessons with video_url references.
 *
 * Usage:
 *   npx tsx scripts/seed-course.ts --course capa
 *   npx tsx scripts/seed-course.ts --course capa --dry-run
 */
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { parseBuffer } from 'music-metadata';

// ── CLI args ────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 ? args[idx + 1] : undefined;
}
const dryRun = args.includes('--dry-run');
const courseSlug = getArg('course');

if (!courseSlug) {
  console.error('Usage: npx tsx scripts/seed-course.ts --course <slug> [--dry-run]');
  process.exit(1);
}

// ── Supabase setup ──────────────────────────────────────────────────
function loadServiceKey(): string {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return process.env.SUPABASE_SERVICE_ROLE_KEY;
  }
  const envPath = path.resolve(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    const match = content.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
    if (match) return match[1].trim();
  }
  throw new Error('SUPABASE_SERVICE_ROLE_KEY not found');
}

const PROJECT_ID = 'guvjbtepgeivfrjdhldx';
const SUPABASE_URL = `https://${PROJECT_ID}.supabase.co`;

// ── Paths ───────────────────────────────────────────────────────────
const contentDir = path.join(__dirname, 'lesson-generator', 'content', courseSlug);
const coursePath = path.join(contentDir, 'course.json');
const audioDir = path.join('C:', 'Projects', 'elearning courses pptx', courseSlug, 'audio');

if (!fs.existsSync(coursePath)) {
  console.error(`Course file not found: ${coursePath}`);
  process.exit(1);
}

// ── Get audio duration ──────────────────────────────────────────────
async function getAudioDurationSeconds(audioPath: string): Promise<number> {
  try {
    const buf = fs.readFileSync(audioPath);
    const metadata = await parseBuffer(buf, { mimeType: 'audio/mpeg' });
    return Math.round(metadata.format.duration || 0);
  } catch {
    return 0;
  }
}

// ── Main ────────────────────────────────────────────────────────────
async function main() {
  const serviceKey = loadServiceKey();
  const supabase = createClient(SUPABASE_URL, serviceKey);

  // Load course metadata
  const courseData = JSON.parse(fs.readFileSync(coursePath, 'utf-8'));
  console.log(`\nSeeding course: ${courseData.title} (${courseData.code})`);

  // Load module files
  const moduleFiles = fs.readdirSync(contentDir)
    .filter(f => f.match(/^module-\d+\.json$/))
    .sort();

  if (moduleFiles.length === 0) {
    console.error('No module files found');
    process.exit(1);
  }

  // Check if course already exists
  const { data: existingCourse } = await supabase
    .from('courses')
    .select('id')
    .eq('slug', courseData.slug)
    .single();

  if (existingCourse) {
    console.log(`\nCourse already exists (ID: ${existingCourse.id}). Deleting and recreating...`);
    if (!dryRun) {
      // Delete cascades to modules and lessons
      await supabase.from('courses').delete().eq('id', existingCourse.id);
    }
  }

  // Calculate total duration
  let totalDurationMinutes = 0;
  const modulesData: any[] = [];

  for (const moduleFile of moduleFiles) {
    const mNum = parseInt(moduleFile.match(/module-(\d+)/)![1]);
    const moduleData = JSON.parse(fs.readFileSync(path.join(contentDir, moduleFile), 'utf-8'));

    let moduleLessons: any[] = [];
    for (let lIdx = 0; lIdx < moduleData.lessons.length; lIdx++) {
      const lNum = lIdx + 1;
      const lesson = moduleData.lessons[lIdx];

      // Calculate lesson duration from audio files
      let totalSeconds = 0;
      for (let sIdx = 0; sIdx < lesson.slides.length; sIdx++) {
        const audioFile = `m${mNum}-l${lNum}-s${sIdx}.mp3`;
        const audioPath = path.join(audioDir, audioFile);
        if (fs.existsSync(audioPath)) {
          totalSeconds += await getAudioDurationSeconds(audioPath);
        }
      }
      const durationMinutes = Math.ceil(totalSeconds / 60);
      totalDurationMinutes += durationMinutes;

      moduleLessons.push({
        slug: lesson.slug,
        title: lesson.title,
        description: lesson.description || '',
        mNum,
        lNum,
        slideCount: lesson.slides.length,
        durationMinutes,
        durationSeconds: totalSeconds,
        videoUrl: `${courseSlug}/lesson-${mNum}-${lNum}.mp4`,
      });
    }

    modulesData.push({
      slug: moduleData.slug,
      title: moduleData.title,
      title_ar: moduleData.title_ar || null,
      description: moduleData.description || '',
      sort_order: mNum,
      lessons: moduleLessons,
    });
  }

  const totalLessons = modulesData.reduce((sum, m) => sum + m.lessons.length, 0);
  const totalHours = (totalDurationMinutes / 60).toFixed(1);

  console.log(`  Modules: ${modulesData.length}`);
  console.log(`  Lessons: ${totalLessons}`);
  console.log(`  Total duration: ${totalDurationMinutes} min (~${totalHours} hrs)`);

  if (dryRun) {
    console.log('\n[DRY RUN] Would create:');
    for (const mod of modulesData) {
      console.log(`  Module ${mod.sort_order}: ${mod.title}`);
      for (const les of mod.lessons) {
        console.log(`    Lesson ${les.lNum}: ${les.title} (${les.durationMinutes}min, ${les.videoUrl})`);
      }
    }
    return;
  }

  // ── Create course ──────────────────────────────────────────────
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .insert({
      title: courseData.title,
      title_ar: courseData.title_ar || null,
      slug: courseData.slug,
      description: courseData.description || '',
      category_id: '707adc15-b2ce-47c6-a101-8886a5e42ac5', // Finance, Investment, Accounting, and Banking
      status: 'published',
      price: 0,
      currency: 'USD',
      is_free: false,
      is_featured: true,
      certificate_enabled: true,
      duration_hours: parseFloat(totalHours),
      difficulty_level: 'intermediate',
      learning_outcomes: [
        'Apply AI tools to automate bookkeeping and transaction classification',
        'Generate and analyze financial reports using AI',
        'Build AI-powered Excel workflows for accounting tasks',
        'Design end-to-end AI accounting automation strategies',
      ],
      tags: ['AI', 'accounting', 'automation', 'bookkeeping', 'financial reporting', 'Excel'],
      metadata: {
        code: courseData.code,
        theme: courseData.theme,
      },
      published_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (courseError) {
    console.error('Failed to create course:', courseError);
    process.exit(1);
  }

  console.log(`\n  Course created: ${course.id}`);

  // ── Create modules and lessons ─────────────────────────────────
  for (const mod of modulesData) {
    const { data: module, error: modError } = await supabase
      .from('modules')
      .insert({
        course_id: course.id,
        title: mod.title,
        title_ar: mod.title_ar,
        description: mod.description,
        sort_order: mod.sort_order,
      })
      .select('id')
      .single();

    if (modError) {
      console.error(`Failed to create module ${mod.sort_order}:`, modError);
      continue;
    }

    console.log(`  Module ${mod.sort_order}: ${mod.title} (${module.id})`);

    for (const les of mod.lessons) {
      const isFirstLesson = mod.sort_order === 1 && les.lNum === 1;

      const { error: lesError } = await supabase
        .from('lessons')
        .insert({
          module_id: module.id,
          course_id: course.id,
          title: les.title,
          description: les.description,
          content_type: 'video',
          sort_order: les.lNum,
          duration_minutes: les.durationMinutes,
          video_url: les.videoUrl,
          video_duration_seconds: les.durationSeconds,
          is_preview: isFirstLesson,
          is_active: true,
          is_mandatory: true,
          allow_speed_control: true,
          allow_download: false,
          allow_skipping: true,
          minimum_watch_percentage: 90,
          auto_save_interval_seconds: 30,
          metadata: {},
        });

      if (lesError) {
        console.error(`    Failed to create lesson ${les.lNum}:`, lesError);
      } else {
        console.log(`    Lesson ${les.lNum}: ${les.title} (${les.durationMinutes}min)`);
      }
    }
  }

  console.log(`\n✅ Done! Course "${courseData.title}" seeded successfully.`);
  console.log(`   Course ID: ${course.id}`);
  console.log(`   Slug: ${courseData.slug}`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
