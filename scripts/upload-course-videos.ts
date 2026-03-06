/**
 * Upload course videos to Supabase Storage (course-videos bucket)
 * using TUS resumable uploads for large files.
 *
 * Usage:
 *   npx tsx scripts/upload-course-videos.ts --course capa
 *   npx tsx scripts/upload-course-videos.ts --course capa --lesson lesson-1-1
 *   npx tsx scripts/upload-course-videos.ts --course caifl
 */
import { createClient } from '@supabase/supabase-js';
import * as tus from 'tus-js-client';
import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ID = 'guvjbtepgeivfrjdhldx';
const SUPABASE_URL = `https://${PROJECT_ID}.supabase.co`;
const TUS_ENDPOINT = `https://${PROJECT_ID}.storage.supabase.co/storage/v1/upload/resumable`;
const BUCKET = 'course-videos';
const CHUNK_SIZE = 6 * 1024 * 1024; // 6MB - required by Supabase

// Parse --course argument
const courseIdx = process.argv.indexOf('--course');
const COURSE_SLUG = courseIdx >= 0 ? process.argv[courseIdx + 1] : 'caifl';
const VIDEO_DIR = `C:\\Projects\\elearning courses pptx\\${COURSE_SLUG}\\videos`;
const STORAGE_PREFIX = COURSE_SLUG;

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

function uploadWithTus(
  filePath: string,
  storagePath: string,
  serviceKey: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(filePath);
    const fileSize = fs.statSync(filePath).size;

    const upload = new tus.Upload(fileStream, {
      endpoint: TUS_ENDPOINT,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        authorization: `Bearer ${serviceKey}`,
        'x-upsert': 'false',
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      chunkSize: CHUNK_SIZE,
      uploadSize: fileSize,
      metadata: {
        bucketName: BUCKET,
        objectName: storagePath,
        contentType: 'video/mp4',
        cacheControl: '3600',
      },
      onError(error) {
        reject(error);
      },
      onProgress(bytesUploaded, bytesTotal) {
        const pct = ((bytesUploaded / bytesTotal) * 100).toFixed(0);
        process.stdout.write(`\r  -> ${pct}% (${(bytesUploaded / 1024 / 1024).toFixed(1)}/${(bytesTotal / 1024 / 1024).toFixed(1)}MB)`);
      },
      onSuccess() {
        process.stdout.write('\r');
        resolve();
      },
    });

    upload.findPreviousUploads().then((previousUploads) => {
      if (previousUploads.length) {
        upload.resumeFromPreviousUpload(previousUploads[0]);
      }
      upload.start();
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  let singleLesson = '';
  const idx = args.indexOf('--lesson');
  if (idx >= 0 && args[idx + 1]) {
    singleLesson = args[idx + 1];
  }

  const serviceKey = loadServiceKey();
  const supabase = createClient(SUPABASE_URL, serviceKey);

  // Get list of MP4 files
  let files: string[];
  if (singleLesson) {
    const f = path.join(VIDEO_DIR, `${singleLesson}.mp4`);
    if (!fs.existsSync(f)) {
      console.error(`File not found: ${f}`);
      process.exit(1);
    }
    files = [f];
  } else {
    files = fs.readdirSync(VIDEO_DIR)
      .filter(f => f.endsWith('.mp4'))
      .sort()
      .map(f => path.join(VIDEO_DIR, f));
  }

  console.log(`Uploading ${files.length} video(s) to Supabase Storage via TUS...\n`);

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const filePath of files) {
    const fileName = path.basename(filePath);
    const storagePath = `${STORAGE_PREFIX}/${fileName}`;
    const fileSize = fs.statSync(filePath).size;
    const sizeMB = (fileSize / 1024 / 1024).toFixed(1);

    process.stdout.write(`${fileName} (${sizeMB}MB): `);

    // Check if already uploaded
    const { data: existing } = await supabase.storage
      .from(BUCKET)
      .list(STORAGE_PREFIX, { search: fileName });

    if (existing && existing.some(f => f.name === fileName)) {
      console.log('already exists, skipping');
      skipped++;
      continue;
    }

    try {
      await uploadWithTus(filePath, storagePath, serviceKey);
      console.log(`${fileName} OK                              `);
      uploaded++;
    } catch (error: any) {
      console.log(`FAILED - ${error.message || error}`);
      failed++;
    }
  }

  console.log(`\nDone! Uploaded: ${uploaded}, Skipped: ${skipped}, Failed: ${failed}`);
}

main().catch(console.error);
