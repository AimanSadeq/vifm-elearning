/**
 * PPTX Audio Autoplay Patcher
 *
 * Post-processes PPTX files to inject animation XML that makes embedded
 * audio narration auto-play when each slide appears in slideshow mode.
 * Matches the exact XML structure used in the CAIFL course (proven working).
 *
 * Usage:
 *   npx tsx scripts/lesson-generator/patch-audio-autoplay.ts --course capa
 *   npx tsx scripts/lesson-generator/patch-audio-autoplay.ts --course capa --lesson lesson-1-1.pptx
 */
import * as fs from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';
import { parseBuffer } from 'music-metadata';

// ── CLI ──────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 ? args[idx + 1] : undefined;
}

const courseName = getArg('course');
const lessonFilter = getArg('lesson');

if (!courseName) {
  console.error('Usage: npx tsx scripts/lesson-generator/patch-audio-autoplay.ts --course <name> [--lesson <file.pptx>]');
  process.exit(1);
}

const PPTX_DIR = path.join('C:', 'Projects', 'elearning courses pptx', courseName);
const AUDIO_DIR = path.join(PPTX_DIR, 'audio');

// ── Get MP3 duration in milliseconds ─────────────────────────────────
async function getAudioDurationMs(audioPath: string): Promise<number> {
  const buf = fs.readFileSync(audioPath);
  const metadata = await parseBuffer(buf, { mimeType: 'audio/mpeg' });
  return Math.round((metadata.format.duration || 0) * 1000);
}

// ── Audio autoplay timing XML (matches CAIFL working format) ─────────
// Exact structure extracted from CAIFL lesson-1-1.pptx slide1 which
// auto-plays audio correctly in PowerPoint slideshow mode.
function buildAutoplayTimingXml(spid: string, durationMs: number): string {
  const dur = durationMs > 0 ? durationMs.toString() : '1000';
  return `<p:timing><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst><p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst><p:par><p:cTn id="3" fill="hold"><p:stCondLst><p:cond delay="indefinite"/><p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond></p:stCondLst><p:childTnLst><p:par><p:cTn id="4" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst><p:par><p:cTn id="5" presetID="1" presetClass="mediacall" presetSubtype="0" fill="hold" nodeType="afterEffect"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst><p:cmd type="call" cmd="playFrom(0.0)"><p:cBhvr><p:cTn id="6" dur="${dur}" fill="hold"/><p:tgtEl><p:spTgt spid="${spid}"/></p:tgtEl></p:cBhvr></p:cmd></p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn><p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst><p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq><p:audio><p:cMediaNode vol="80000" showWhenStopped="0"><p:cTn id="7" fill="hold" display="0"><p:stCondLst><p:cond delay="indefinite"/></p:stCondLst><p:endCondLst><p:cond evt="onStopAudio" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:endCondLst></p:cTn><p:tgtEl><p:spTgt spid="${spid}"/></p:tgtEl></p:cMediaNode></p:audio></p:childTnLst></p:cTn></p:par></p:tnLst></p:timing>`;
}

// ── Find audio shape ID from slide XML ───────────────────────────────
function findAudioShapeId(slideXml: string): string | null {
  // pptxgenjs embeds audio as a <p:pic> with:
  //   <p:cNvPr id="X" name="Media 0"> + action="ppaction://media"
  //   <p:nvPr><a:videoFile r:link="..."/> + <p14:media .../>
  if (!slideXml.includes('ppaction://media')) return null;

  const picBlocks = slideXml.split(/<p:pic\b/);
  for (let i = 1; i < picBlocks.length; i++) {
    const block = picBlocks[i];
    if (block.includes('ppaction://media')) {
      const idMatch = block.match(/<p:cNvPr\s+id="(\d+)"/);
      if (idMatch) return idMatch[1];
    }
  }
  return null;
}

// ── Extract slide number from entry name ─────────────────────────────
function getSlideNumber(entryName: string): number {
  const match = entryName.match(/slide(\d+)\.xml$/);
  return match ? parseInt(match[1]) : 0;
}

// ── Patch a single PPTX file ─────────────────────────────────────────
async function patchPptx(pptxPath: string, pptxFilename: string): Promise<{ patched: number; total: number }> {
  const zip = new AdmZip(pptxPath);
  let patchedCount = 0;
  let slideCount = 0;

  // Extract module/lesson numbers from filename (lesson-M-L.pptx)
  const match = pptxFilename.match(/lesson-(\d+)-(\d+)\.pptx$/);
  if (!match) return { patched: 0, total: 0 };
  const mNum = parseInt(match[1]);
  const lNum = parseInt(match[2]);

  // Find all slide XML entries
  const slideEntries = zip.getEntries()
    .filter(e => e.entryName.match(/^ppt\/slides\/slide\d+\.xml$/))
    .sort((a, b) => getSlideNumber(a.entryName) - getSlideNumber(b.entryName));

  slideCount = slideEntries.length;

  for (const entry of slideEntries) {
    let xml = entry.getData().toString('utf-8');
    const slideNum = getSlideNumber(entry.entryName);
    const slideIdx = slideNum - 1; // 0-indexed for audio filename

    // Check if this slide has audio
    const audioShapeId = findAudioShapeId(xml);
    if (!audioShapeId) continue;

    // Check if timing already exists (don't double-patch)
    if (xml.includes('<p:timing')) continue;

    // Get audio duration from the matching MP3 file
    const audioFile = `m${mNum}-l${lNum}-s${slideIdx}.mp3`;
    const audioPath = path.join(AUDIO_DIR, audioFile);
    let durationMs = 0;

    if (fs.existsSync(audioPath)) {
      try {
        durationMs = await getAudioDurationMs(audioPath);
      } catch {
        console.log(`    [warn] Could not read duration for ${audioFile}`);
      }
    }

    // Inject autoplay timing before </p:sld>
    const timingXml = buildAutoplayTimingXml(audioShapeId, durationMs);
    xml = xml.replace('</p:sld>', timingXml + '</p:sld>');

    // Update the entry in the ZIP
    zip.updateFile(entry.entryName, Buffer.from(xml, 'utf-8'));
    patchedCount++;
  }

  if (patchedCount > 0) {
    zip.writeZip(pptxPath);
  }

  return { patched: patchedCount, total: slideCount };
}

// ── Main ─────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🔊 PPTX Audio Autoplay Patcher\n');

  if (!fs.existsSync(PPTX_DIR)) {
    console.error(`Directory not found: ${PPTX_DIR}`);
    process.exit(1);
  }

  // Get PPTX files
  let pptxFiles: string[];
  if (lessonFilter) {
    pptxFiles = [lessonFilter];
  } else {
    pptxFiles = fs.readdirSync(PPTX_DIR)
      .filter(f => f.startsWith('lesson-') && f.endsWith('.pptx'))
      .sort();
  }

  if (pptxFiles.length === 0) {
    console.error('No PPTX files found.');
    process.exit(1);
  }

  let totalPatched = 0;
  let totalSlides = 0;

  for (const file of pptxFiles) {
    const filePath = path.join(PPTX_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.log(`  [skip] ${file} — not found`);
      continue;
    }

    const { patched, total } = await patchPptx(filePath, file);
    totalPatched += patched;
    totalSlides += total;

    if (patched > 0) {
      console.log(`  [patched] ${file} — ${patched}/${total} slides with autoplay`);
    } else {
      console.log(`  [skip] ${file} — no audio or already patched`);
    }
  }

  console.log(`\n✅ Done! Patched ${totalPatched}/${totalSlides} slides across ${pptxFiles.length} files.`);
  console.log(`   Output: ${PPTX_DIR}\n`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
