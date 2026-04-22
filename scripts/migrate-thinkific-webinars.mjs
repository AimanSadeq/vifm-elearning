/**
 * Migrate Thinkific "FREE WEBINARS" collection courses into the webinars table.
 *
 * For each course whose Thinkific collection was "FREE WEBINARS":
 *   1. Insert a webinars row (status=completed, scheduled_at=published_at).
 *   2. Archive the courses row (status=archived) so it leaves /courses.
 *
 * Usage:
 *   node scripts/migrate-thinkific-webinars.mjs --dry-run
 *   node scripts/migrate-thinkific-webinars.mjs
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY_RUN = process.argv.includes("--dry-run");

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const BACKUP_DIR = path.join(__dirname, "..", "thinkific-courses", "backup");

function loadBackup(name) {
  const file = fs.readdirSync(BACKUP_DIR).find((f) => f.startsWith(name));
  if (!file) throw new Error(`Missing Thinkific backup: ${name}`);
  return JSON.parse(fs.readFileSync(path.join(BACKUP_DIR, file), "utf8"));
}

async function run() {
  console.log(DRY_RUN ? "DRY RUN — no writes will be performed\n" : "Running real migration\n");

  const tCollections = loadBackup("thinkific_collections");
  const tCourses = loadBackup("thinkific_courses");

  const webinarColl = tCollections.find((c) => c.name === "FREE WEBINARS");
  if (!webinarColl) {
    console.error("FREE WEBINARS collection not found in backup");
    process.exit(1);
  }
  const webinarPids = new Set(webinarColl.product_ids);
  const collectionIds = tCourses
    .filter((c) => webinarPids.has(c.product_id))
    .map((c) => c.thinkific_id.toString());

  // Additional webinar courses identified by content signals (description
  // mentions "this webinar", or lessons like "Download Webinar Supporting
  // Materials" / "Thank you for attending Virginia Webinars!"). They weren't
  // tagged with the FREE WEBINARS Thinkific collection.
  const extraWebinarThinkificIds = [
    "2767545", // Derivatives: Forward vs Futures
    "2771667", // Connection Between Financial Statement & Tactics for Cash Liquidity Enhancement
    "2788896", // Mastering Organizational Control: Frameworks and Governance for Excellence
    "2788903", // Internal Audit Basics and Principles & Governance & Risk Management
    "2767568", // Accounting Fundamentals & Financial Reporting
    "2968727", // Exemplary Practices in Corporate Governance
  ];

  const webinarThinkificIds = Array.from(
    new Set([...collectionIds, ...extraWebinarThinkificIds])
  );

  console.log(`Thinkific FREE WEBINARS thinkific_ids: ${webinarThinkificIds.length}`);

  const { data: courses, error } = await supabase
    .from("courses")
    .select(
      "id, title, title_ar, description, description_ar, thumbnail_url, instructor_id, category_id, is_free, price, currency, tags, duration_hours, published_at, created_at, metadata, status"
    )
    .in("metadata->>thinkific_id", webinarThinkificIds);

  if (error) {
    console.error("Failed to fetch courses:", error);
    process.exit(1);
  }

  console.log(`Matched DB courses: ${courses.length}\n`);

  const succeeded = [];
  const failed = [];
  const skipped = [];

  for (const c of courses) {
    const label = `[${c.id.slice(0, 8)}] ${c.title.slice(0, 60)}`;

    if (c.status === "archived") {
      console.log(`${label} ... already archived, skipping`);
      skipped.push(c);
      continue;
    }

    const scheduledAt = c.published_at || c.created_at;
    const durationMinutes = c.duration_hours
      ? Math.max(1, Math.round(c.duration_hours * 60))
      : 60;

    const webinarRow = {
      title: c.title,
      title_ar: c.title_ar,
      description: c.description,
      description_ar: c.description_ar,
      thumbnail_url: c.thumbnail_url,
      instructor_id: c.instructor_id,
      category_id: c.category_id,
      status: "completed",
      meeting_url: null,
      meeting_id: null,
      scheduled_at: scheduledAt,
      duration_minutes: durationMinutes,
      recording_url: null,
      is_recording_public: false,
      max_attendees: null,
      is_free: c.is_free ?? true,
      price: c.price ?? 0,
      currency: c.currency ?? "USD",
      tags: Array.isArray(c.tags) ? [...new Set([...c.tags, "webinar"])] : ["webinar"],
      metadata: {
        ...(c.metadata ?? {}),
        source: "thinkific_webinar",
        migrated_from_course_id: c.id,
        migrated_at: new Date().toISOString(),
      },
    };

    try {
      if (DRY_RUN) {
        console.log(
          `${label} ... would insert webinar (scheduled_at=${scheduledAt}, duration=${durationMinutes}m, free=${webinarRow.is_free}) and archive course`
        );
        succeeded.push(c);
        continue;
      }

      const { data: inserted, error: insErr } = await supabase
        .from("webinars")
        .insert(webinarRow)
        .select("id")
        .single();

      if (insErr || !inserted) throw new Error(`webinar insert: ${insErr?.message}`);

      const { error: updErr } = await supabase
        .from("courses")
        .update({
          status: "archived",
          updated_at: new Date().toISOString(),
          metadata: {
            ...(c.metadata ?? {}),
            archived_reason: "migrated_to_webinar",
            migrated_to_webinar_id: inserted.id,
            archived_at: new Date().toISOString(),
          },
        })
        .eq("id", c.id);

      if (updErr) throw new Error(`course archive: ${updErr.message}`);

      console.log(`${label} ... OK (webinar=${inserted.id.slice(0, 8)})`);
      succeeded.push(c);
    } catch (err) {
      console.log(`${label} ... FAILED — ${err.message}`);
      failed.push({ course: c, reason: err.message });
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Succeeded: ${succeeded.length}`);
  console.log(`Skipped (already archived): ${skipped.length}`);
  console.log(`Failed: ${failed.length}`);
  if (failed.length) {
    for (const f of failed) {
      console.log(`  - ${f.course.id} "${f.course.title}" — ${f.reason}`);
    }
  }
}

run().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
