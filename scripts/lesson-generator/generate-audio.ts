/**
 * VIFM Audio Generator CLI — Generates ElevenLabs TTS audio for all lesson slides.
 *
 * Usage:
 *   npx tsx scripts/lesson-generator/generate-audio.ts --course caifl
 *   npx tsx scripts/lesson-generator/generate-audio.ts --course caifl --module 1
 *   npx tsx scripts/lesson-generator/generate-audio.ts --course caifl --module 1 --lesson 1
 *   npx tsx scripts/lesson-generator/generate-audio.ts --course caifl --voice <voice_id>
 *   npx tsx scripts/lesson-generator/generate-audio.ts --course caifl --force  (regenerate even if cached)
 *
 * Outputs MP3 files to: public/courses/<course>/audio/
 */
import * as fs from 'fs';
import * as path from 'path';
import type { CourseContent, ModuleContent } from './types';
import { generateSpeech, type ElevenLabsConfig } from './elevenlabs';

// ── CLI Args ──────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 ? args[idx + 1] : undefined;
}
const hasFlag = (name: string) => args.includes(`--${name}`);

const courseName = getArg('course');
const moduleFilter = getArg('module');
const lessonFilter = getArg('lesson');
const voiceOverride = getArg('voice');
const forceRegenerate = hasFlag('force');

if (!courseName) {
  console.error('Usage: npx tsx scripts/lesson-generator/generate-audio.ts --course <name> [--module <n>] [--lesson <n>] [--voice <id>] [--force]');
  process.exit(1);
}

// ── Paths ─────────────────────────────────────────────────────────────
const ROOT = path.resolve(__dirname, '..', '..');
const CONTENT_DIR = path.join(__dirname, 'content', courseName);
const OUTPUT_DIR = path.join(ROOT, 'public', 'courses', courseName);
const AUDIO_DIR = path.join(OUTPUT_DIR, 'audio');

// ── Load .env.local ──────────────────────────────────────────────────
const envPath = path.join(ROOT, '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').replace(/\r/g, '').split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      process.env[key] = val;
    }
  });
}

// ── Load Course ───────────────────────────────────────────────────────
function loadCourse(): CourseContent {
  const coursePath = path.join(CONTENT_DIR, 'course.json');
  if (!fs.existsSync(coursePath)) {
    console.error(`Course file not found: ${coursePath}`);
    process.exit(1);
  }
  const course: CourseContent = JSON.parse(fs.readFileSync(coursePath, 'utf-8'));
  const moduleFiles = fs.readdirSync(CONTENT_DIR)
    .filter(f => f.startsWith('module-') && f.endsWith('.json'))
    .sort();
  course.modules = moduleFiles.map(f =>
    JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, f), 'utf-8')) as ModuleContent
  );
  return course;
}

// ── Main ──────────────────────────────────────────────────────────────
async function main() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error('ELEVENLABS_API_KEY not set in .env.local');
    process.exit(1);
  }

  const voiceId = voiceOverride || process.env.ELEVENLABS_VOICE_ID || 'TxGEqnHWrfWFTfGW9XjX';

  const config: ElevenLabsConfig = {
    apiKey,
    voiceId,
    modelId: 'eleven_multilingual_v2',
    stability: 0.5,
    similarityBoost: 0.75,
  };

  console.log(`\n🔊 VIFM Audio Generator\n`);
  console.log(`Voice: ${voiceId}`);
  console.log(`Force regenerate: ${forceRegenerate ? 'yes' : 'no (using cache)'}`);

  const course = loadCourse();
  console.log(`Course: ${course.title} (${course.code})`);

  // Filter modules
  let modules = course.modules;
  if (moduleFilter) {
    const n = parseInt(moduleFilter);
    modules = modules.filter(m => m.sort_order === n);
    if (modules.length === 0) { console.error(`Module ${moduleFilter} not found`); process.exit(1); }
  }

  // Ensure audio directory
  if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

  let totalGenerated = 0;
  let totalCached = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const mod of modules) {
    console.log(`\n📦 Module ${mod.sort_order}: ${mod.title}`);

    for (let li = 0; li < mod.lessons.length; li++) {
      // Filter by lesson number if specified
      if (lessonFilter && (li + 1) !== parseInt(lessonFilter)) continue;

      const lesson = mod.lessons[li];
      const prefix = `m${mod.sort_order}-l${li + 1}`;
      console.log(`\n  📝 Lesson ${li + 1}: ${lesson.title}`);

      for (let si = 0; si < lesson.slides.length; si++) {
        const slide = lesson.slides[si];
        const narration = slide.narration || '';

        if (!narration.trim()) {
          totalSkipped++;
          continue;
        }

        const filename = `${prefix}-s${si}.mp3`;
        const outputPath = path.join(AUDIO_DIR, filename);

        // Skip if cached (unless --force)
        if (!forceRegenerate && fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
          console.log(`    [cached] ${filename}`);
          totalCached++;
          continue;
        }

        try {
          const { durationMs } = await generateSpeech(narration, config, forceRegenerate ? (() => {
            // Delete existing to force regeneration
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
            return outputPath;
          })() : outputPath);

          console.log(`    [generated] ${filename} (${Math.round(durationMs / 1000)}s, ~${narration.length} chars)`);
          totalGenerated++;
        } catch (err: any) {
          console.error(`    [ERROR] ${filename}: ${err.message}`);
          totalErrors++;
        }

        // Rate limiting — 500ms between requests
        if (si < lesson.slides.length - 1) {
          await new Promise(r => setTimeout(r, 500));
        }
      }
    }
  }

  console.log(`\n✨ Audio generation complete!`);
  console.log(`   Generated: ${totalGenerated}`);
  console.log(`   Cached:    ${totalCached}`);
  console.log(`   Skipped:   ${totalSkipped} (no narration)`);
  if (totalErrors > 0) console.log(`   Errors:    ${totalErrors}`);
  console.log(`   Output:    ${AUDIO_DIR}\n`);

  if (totalGenerated > 0) {
    console.log(`💡 Now regenerate HTML with audio:`);
    console.log(`   npx tsx scripts/lesson-generator/generate.ts --course ${courseName}\n`);
  }
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
