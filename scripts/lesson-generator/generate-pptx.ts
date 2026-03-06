/**
 * VIFM PPTX Lesson Generator
 *
 * Usage:
 *   tsx scripts/lesson-generator/generate-pptx.ts --course caifl
 *   tsx scripts/lesson-generator/generate-pptx.ts --course caifl --module 1
 *   tsx scripts/lesson-generator/generate-pptx.ts --course caifl --module 1 --lesson 1
 */

import * as fs from 'fs';
import * as path from 'path';
import type { CourseContent, ModuleContent, Slide, ThemeId } from './types';
import { createPresentation } from './pptx/base';
import { getColors } from './pptx/theme';
import { renderSlide } from './pptx/renderers/index';
// ── Parse CLI args ───────────────────────────────────────────────────
function parseArgs(): { course: string; module?: number; lesson?: number } {
  const args = process.argv.slice(2);
  let course = '';
  let module_: number | undefined;
  let lesson: number | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--course' && args[i + 1]) course = args[++i];
    if (args[i] === '--module' && args[i + 1]) module_ = parseInt(args[++i]);
    if (args[i] === '--lesson' && args[i + 1]) lesson = parseInt(args[++i]);
  }

  if (!course) {
    console.error('Usage: tsx scripts/lesson-generator/generate-pptx.ts --course <slug> [--module N] [--lesson N]');
    process.exit(1);
  }

  return { course, module: module_, lesson };
}

// ── Slide type → master name ─────────────────────────────────────────
const TITLE_TYPES = new Set(['intro', 'module-title', 'outro', 'big-statement', 'quote']);
function getMasterName(slideType: string): string {
  return TITLE_TYPES.has(slideType) ? 'VIFM_TITLE' : 'VIFM_CONTENT';
}

// ── Main ─────────────────────────────────────────────────────────────
async function main() {
  const { course, module: moduleNum, lesson: lessonNum } = parseArgs();

  const contentDir = path.join(__dirname, 'content', course);
  const coursePath = path.join(contentDir, 'course.json');

  // Load course metadata
  let themeId: ThemeId = 'finance';
  let courseTitle = course.toUpperCase();

  if (fs.existsSync(coursePath)) {
    const courseData: CourseContent = JSON.parse(fs.readFileSync(coursePath, 'utf-8'));
    themeId = courseData.theme || 'finance';
    courseTitle = courseData.title;
  }

  const colors = getColors(themeId);

  // Find module files
  const moduleFiles = fs.readdirSync(contentDir)
    .filter(f => f.match(/^module-\d+\.json$/))
    .sort();

  if (moduleFiles.length === 0) {
    console.error(`No module files found in ${contentDir}`);
    process.exit(1);
  }

  // Output directory (local drive — avoids OneDrive sync issues with COM automation)
  const outDir = path.join('C:', 'Projects', 'elearning courses pptx', course);
  fs.mkdirSync(outDir, { recursive: true });

  let totalSlides = 0;
  let totalLessons = 0;

  for (const moduleFile of moduleFiles) {
    const mNum = parseInt(moduleFile.match(/module-(\d+)/)![1]);
    if (moduleNum !== undefined && mNum !== moduleNum) continue;

    const moduleData: ModuleContent = JSON.parse(
      fs.readFileSync(path.join(contentDir, moduleFile), 'utf-8')
    );

    console.log(`\nModule ${mNum}: ${moduleData.title}`);

    for (let lIdx = 0; lIdx < moduleData.lessons.length; lIdx++) {
      const lNum = lIdx + 1;
      if (lessonNum !== undefined && lNum !== lessonNum) continue;

      const lesson = moduleData.lessons[lIdx];
      console.log(`  Lesson ${lNum}: ${lesson.title} (${lesson.slides.length} slides)`);

      // Create fresh presentation for each lesson
      const pres = createPresentation(courseTitle, themeId);

      // Audio directory (check local first, then project folder)
      const localAudioDir = path.join(outDir, 'audio');
      const projectAudioDir = path.join(__dirname, '..', '..', 'public', 'courses', course, 'audio');
      const audioDir = fs.existsSync(localAudioDir) ? localAudioDir : projectAudioDir;

      // Render each slide
      let audioCount = 0;
      const slideCount = lesson.slides.length;
      for (let sIdx = 0; sIdx < slideCount; sIdx++) {
        const slideData = lesson.slides[sIdx];
        const masterName = getMasterName(slideData.type);

        // Check for matching audio file
        const audioFile = `m${mNum}-l${lNum}-s${sIdx}.mp3`;
        const audioPath = path.join(audioDir, audioFile);
        const audio = fs.existsSync(audioPath) ? audioPath : undefined;
        if (audio) audioCount++;

        renderSlide(pres, slideData, colors, masterName, sIdx + 1, slideCount, audio, { moduleNum: mNum, lessonNum: lNum });

        totalSlides++;
      }

      // Write PPTX (clean — autoplay will be set via PowerPoint COM automation)
      const fileName = `lesson-${mNum}-${lNum}.pptx`;
      const outPath = path.join(outDir, fileName);
      await pres.writeFile({ fileName: outPath });

      console.log(`    -> ${fileName} (${lesson.slides.length} slides, ${audioCount} with audio)`);
      totalLessons++;
    }
  }

  console.log(`\nDone! Generated ${totalLessons} lesson(s) with ${totalSlides} total slides.`);
  console.log(`Output: ${outDir}`);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
