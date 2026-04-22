/**
 * Rehost course thumbnails from Thinkific CDN to Supabase Storage.
 *
 * Finds every course whose thumbnail_url still points at thinkific.com,
 * downloads the image, uploads it to the `course-assets` bucket at
 * `courses/{courseId}/thumbnail.{ext}`, then updates courses.thumbnail_url
 * to the Supabase-hosted public URL.
 *
 * Usage:
 *   node scripts/rehost-course-thumbnails.mjs --dry-run
 *   node scripts/rehost-course-thumbnails.mjs
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "course-assets";
const DRY_RUN = process.argv.includes("--dry-run");

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function extFromUrl(url) {
  try {
    const pathname = new URL(url).pathname;
    const m = pathname.match(/\.(jpe?g|png|webp|gif|avif)$/i);
    return m ? m[1].toLowerCase().replace("jpeg", "jpg") : "jpg";
  } catch {
    return "jpg";
  }
}

function contentTypeForExt(ext) {
  switch (ext) {
    case "png": return "image/png";
    case "webp": return "image/webp";
    case "gif": return "image/gif";
    case "avif": return "image/avif";
    default: return "image/jpeg";
  }
}

async function downloadImage(url) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 100) throw new Error(`Suspiciously small body (${buf.length} bytes)`);
  return buf;
}

async function run() {
  console.log(DRY_RUN ? "DRY RUN — no changes will be written\n" : "Running rehost for real\n");

  const { data: courses, error } = await supabase
    .from("courses")
    .select("id, title, thumbnail_url")
    .ilike("thumbnail_url", "%thinkific%");

  if (error) {
    console.error("Failed to query courses:", error);
    process.exit(1);
  }

  console.log(`Found ${courses.length} courses with Thinkific-hosted thumbnails\n`);

  let succeeded = 0;
  let skipped = 0;
  const failures = [];

  for (const course of courses) {
    const sourceUrl = course.thumbnail_url;
    const ext = extFromUrl(sourceUrl);
    const destPath = `courses/${course.id}/thumbnail.${ext}`;
    const label = `[${course.id.slice(0, 8)}] ${course.title.slice(0, 60)}`;

    try {
      process.stdout.write(`${label} ... `);

      if (DRY_RUN) {
        console.log(`would fetch ${sourceUrl} → ${BUCKET}/${destPath}`);
        skipped++;
        continue;
      }

      const bytes = await downloadImage(sourceUrl);

      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(destPath, bytes, {
          contentType: contentTypeForExt(ext),
          upsert: true,
          cacheControl: "31536000",
        });

      if (uploadErr) throw new Error(`upload: ${uploadErr.message}`);

      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(destPath);
      const newUrl = pub.publicUrl;

      const { error: updateErr } = await supabase
        .from("courses")
        .update({ thumbnail_url: newUrl, updated_at: new Date().toISOString() })
        .eq("id", course.id);

      if (updateErr) throw new Error(`update: ${updateErr.message}`);

      console.log(`OK (${(bytes.length / 1024).toFixed(0)} KB)`);
      succeeded++;
    } catch (err) {
      console.log(`FAILED — ${err.message}`);
      failures.push({ id: course.id, title: course.title, sourceUrl, reason: err.message });
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Succeeded: ${succeeded}`);
  console.log(`Skipped (dry-run):  ${skipped}`);
  console.log(`Failed:    ${failures.length}`);
  if (failures.length) {
    console.log(`\nFailures:`);
    for (const f of failures) console.log(`  - ${f.id} "${f.title}" — ${f.reason}\n    ${f.sourceUrl}`);
  }
}

run().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
