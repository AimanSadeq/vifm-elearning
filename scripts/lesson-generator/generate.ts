/**
 * VIFM Lesson Generator CLI
 *
 * Usage:
 *   npx tsx scripts/lesson-generator/generate.ts --course caifl
 *   npx tsx scripts/lesson-generator/generate.ts --course caifl --module 1
 *   npx tsx scripts/lesson-generator/generate.ts --course caifl --no-audio  (skip ElevenLabs)
 */
import * as fs from 'fs';
import * as path from 'path';
import type { CourseContent, ModuleContent, LessonContent } from './types';
import { generateHTML } from './template/base';
import { renderSlide } from './template/slides/index';
import { generateLessonAudio, type ElevenLabsConfig } from './elevenlabs';

// ── CLI Args ──────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 ? args[idx + 1] : undefined;
}
const hasFlag = (name: string) => args.includes(`--${name}`);

const courseName = getArg('course');
const moduleFilter = getArg('module');
const skipAudio = hasFlag('no-audio');

if (!courseName) {
  console.error('Usage: npx tsx scripts/lesson-generator/generate.ts --course <name> [--module <n>] [--no-audio]');
  process.exit(1);
}

// ── Paths ─────────────────────────────────────────────────────────────
const ROOT = path.resolve(__dirname, '..', '..');
const CONTENT_DIR = path.join(__dirname, 'content', courseName);
const OUTPUT_DIR = path.join(ROOT, 'public', 'courses', courseName);

// ── Load Course ───────────────────────────────────────────────────────
function loadCourse(): CourseContent {
  const coursePath = path.join(CONTENT_DIR, 'course.json');
  if (!fs.existsSync(coursePath)) {
    console.error(`Course file not found: ${coursePath}`);
    process.exit(1);
  }
  const course: CourseContent = JSON.parse(fs.readFileSync(coursePath, 'utf-8'));

  // Load module files
  const moduleFiles = fs.readdirSync(CONTENT_DIR)
    .filter(f => f.startsWith('module-') && f.endsWith('.json'))
    .sort();

  course.modules = moduleFiles.map(f => {
    const mod: ModuleContent = JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, f), 'utf-8'));
    return mod;
  });

  return course;
}

// ── Generate ──────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🎬 VIFM Lesson Generator\n`);

  const course = loadCourse();
  console.log(`Course: ${course.title} (${course.code})`);
  console.log(`Theme: ${course.theme}`);
  console.log(`Modules: ${course.modules.length}`);

  // Filter modules if specified
  let modules = course.modules;
  if (moduleFilter) {
    const n = parseInt(moduleFilter);
    modules = modules.filter(m => m.sort_order === n);
    if (modules.length === 0) {
      console.error(`Module ${moduleFilter} not found`);
      process.exit(1);
    }
  }

  // Ensure output directory
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const audioDir = path.join(OUTPUT_DIR, 'audio');
  if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });

  // ElevenLabs config
  let elConfig: ElevenLabsConfig | null = null;
  if (!skipAudio) {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      console.warn('⚠ ELEVENLABS_API_KEY not set. Skipping audio generation.');
      console.warn('  Set it in .env.local or run with --no-audio');
    } else {
      elConfig = {
        apiKey,
        voiceId: process.env.ELEVENLABS_VOICE_ID || 'TxGEqnHWrfWFTfGW9XjX', // Default: Josh (deep narration)
        modelId: 'eleven_multilingual_v2',
        stability: 0.5,
        similarityBoost: 0.75,
      };
      console.log(`Audio: ElevenLabs (voice: ${elConfig.voiceId})`);
    }
  }

  let totalLessons = 0;
  let totalSlides = 0;

  for (const mod of modules) {
    console.log(`\n📦 Module ${mod.sort_order}: ${mod.title}`);
    console.log(`   Lessons: ${mod.lessons.length}`);

    for (let li = 0; li < mod.lessons.length; li++) {
      const lesson = mod.lessons[li];
      console.log(`\n  📝 Lesson ${li + 1}: ${lesson.title}`);

      // Render all slides
      const slidesHtml = lesson.slides.map(slide => renderSlide(slide)).join('\n');
      totalSlides += lesson.slides.length;

      // Generate audio
      let audioFiles: string[] = [];
      let durations: number[] = [];

      if (elConfig) {
        const narrations = lesson.slides.map(s => s.narration || '');
        const prefix = `m${mod.sort_order}-l${li + 1}`;

        console.log(`    🔊 Generating audio for ${narrations.filter(n => n).length} slides...`);
        const result = await generateLessonAudio(
          narrations,
          elConfig,
          audioDir,
          prefix,
        );
        audioFiles = result.files;
        durations = result.durations;
      } else {
        // No audio — use default 6.5s per slide
        audioFiles = lesson.slides.map(() => '');
        durations = lesson.slides.map(() => 6500);
      }

      // Generate HTML
      const html = generateHTML({
        title: `${lesson.title} — ${course.title}`,
        theme: course.theme,
        slidesHtml,
        audioFiles,
        durations,
      });

      // Write file
      const filename = `m${mod.sort_order}-l${li + 1}-${lesson.slug}.html`;
      const outPath = path.join(OUTPUT_DIR, filename);
      fs.writeFileSync(outPath, html, 'utf-8');
      console.log(`    ✅ ${filename} (${lesson.slides.length} slides, ${Math.round(html.length / 1024)}KB)`);
      totalLessons++;
    }
  }

  console.log(`\n✨ Done! Generated ${totalLessons} lessons with ${totalSlides} slides.`);
  console.log(`   Output: ${OUTPUT_DIR}\n`);
}

// Load .env.local
const envPath = path.join(ROOT, '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').replace(/\r/g, '').split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      process.env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
    }
  });
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
