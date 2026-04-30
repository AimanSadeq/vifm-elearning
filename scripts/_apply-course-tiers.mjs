// Match courses + designations against `Course tiers.xlsx` by title.
//   - Course matched in file        → set tier_level from file, leave status alone
//   - Course NOT in file            → set status = 'draft'
//   - Designation matched in file   → set metadata.tier_level from file
// Pass `--commit` to actually apply; default is dry-run (prints proposed
// changes only).
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import * as XLSX from "xlsx";

const env = readFileSync(".env.local", "utf8");
const get = (k) => env.match(new RegExp("^" + k + "=(.*)$", "m"))?.[1]?.trim();
const sb = createClient(
  get("NEXT_PUBLIC_SUPABASE_URL"),
  get("SUPABASE_SERVICE_ROLE_KEY")
);

const COMMIT = process.argv.includes("--commit");

// ---------- 1. Load + normalize the spreadsheet ----------
const wb = XLSX.read(
  readFileSync("/Users/asaadalsharif/Downloads/Course tiers.xlsx"),
  { type: "buffer" }
);
const rawRows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
  defval: "",
});

/** Strip diacritics, casing, parenthetical abbreviation suffix, punctuation. */
function normalize(s) {
  if (!s) return "";
  return String(s)
    .normalize("NFKD")
    // Drop combining marks (Arabic harakat, Latin accents).
    .replace(/[̀-ًͯ-ٟ]/g, "")
    .toLowerCase()
    // Drop parenthesized acronym tail like " (CAPA)".
    .replace(/\s*\([^)]*\)\s*/g, " ")
    // Collapse all non-alphanumeric runs (Arabic chars stay intact).
    .replace(/[^a-z0-9؀-ۿ]+/g, " ")
    .trim();
}

// The xlsx header for column 1 is a private-use char (0xE113), not "", so
// we can't access by name. Read each row's keys positionally instead.
const fileEntries = [];
for (const row of rawRows) {
  const keys = Object.keys(row);
  if (keys.length < 2) continue;
  const title = String(row[keys[0]] ?? "").trim();
  const tierRaw = String(row[keys[1]] ?? "").trim().toLowerCase();
  if (!title || title.toLowerCase() === "course name") continue;
  if (!["gateway", "professional", "executive"].includes(tierRaw)) continue;
  fileEntries.push({ title, tier: tierRaw, key: normalize(title) });
}
console.log(`Loaded ${fileEntries.length} rows from spreadsheet.\n`);

const fileIndex = new Map();
for (const e of fileEntries) fileIndex.set(e.key, e);

// ---------- 2. Pull existing courses + designations ----------
const { data: courses } = await sb
  .from("courses")
  .select("id, title, title_ar, status, tier_level");
const { data: designations } = await sb
  .from("designations")
  .select("id, name, name_ar, abbreviation, metadata");

// ---------- 3. Plan changes ----------
const courseUpdates = [];
const courseDrafts = [];
const designationRetiers = [];

for (const c of courses ?? []) {
  const candidates = [c.title, c.title_ar].filter(Boolean);
  let matched = null;
  for (const t of candidates) {
    const k = normalize(t);
    if (fileIndex.has(k)) {
      matched = fileIndex.get(k);
      break;
    }
  }
  if (matched) {
    if (c.tier_level !== matched.tier) {
      courseUpdates.push({ id: c.id, title: c.title ?? c.title_ar, from: c.tier_level, to: matched.tier });
    }
  } else {
    if (c.status !== "draft") {
      courseDrafts.push({ id: c.id, title: c.title ?? c.title_ar, from: c.status });
    }
  }
}

for (const d of designations ?? []) {
  const candidates = [d.name, d.name_ar, d.abbreviation].filter(Boolean);
  let matched = null;
  for (const t of candidates) {
    const k = normalize(t);
    if (fileIndex.has(k)) {
      matched = fileIndex.get(k);
      break;
    }
  }
  if (!matched) continue;
  const current = d.metadata?.tier_level ?? null;
  if (current !== matched.tier) {
    designationRetiers.push({
      id: d.id,
      abbr: d.abbreviation,
      name: d.name,
      from: current,
      to: matched.tier,
    });
  }
}

// ---------- 4. Report ----------
console.log(`COURSE TIER UPDATES (${courseUpdates.length}):`);
for (const u of courseUpdates) console.log(`  ${u.title}  ${u.from ?? "—"} → ${u.to}`);

console.log(`\nCOURSES → DRAFT (not in file) (${courseDrafts.length}):`);
for (const u of courseDrafts) console.log(`  [${u.from}] ${u.title}`);

console.log(`\nDESIGNATION RE-TIERS (${designationRetiers.length}):`);
for (const u of designationRetiers)
  console.log(`  ${u.abbr.padEnd(8)} ${u.from ?? "—"} → ${u.to}  (${u.name})`);

// Spreadsheet rows that didn't match anything in the DB
const matchedKeys = new Set();
for (const c of courses ?? []) {
  for (const t of [c.title, c.title_ar].filter(Boolean)) {
    if (fileIndex.has(normalize(t))) matchedKeys.add(normalize(t));
  }
}
for (const d of designations ?? []) {
  for (const t of [d.name, d.name_ar, d.abbreviation].filter(Boolean)) {
    if (fileIndex.has(normalize(t))) matchedKeys.add(normalize(t));
  }
}
const unmatched = fileEntries.filter((e) => !matchedKeys.has(e.key));
console.log(`\nFILE ROWS WITH NO MATCH IN DB (${unmatched.length}):`);
for (const u of unmatched) console.log(`  [${u.tier}] ${u.title}`);

// ---------- 5. Commit if asked ----------
if (!COMMIT) {
  console.log(`\n(dry run — pass --commit to apply)`);
  process.exit(0);
}

console.log("\nApplying…");
for (const u of courseUpdates) {
  const { error } = await sb.from("courses").update({ tier_level: u.to }).eq("id", u.id);
  if (error) console.log(`  ✗ ${u.title}: ${error.message}`);
}
for (const u of courseDrafts) {
  const { error } = await sb.from("courses").update({ status: "draft" }).eq("id", u.id);
  if (error) console.log(`  ✗ ${u.title}: ${error.message}`);
}
for (const u of designationRetiers) {
  const { data: row } = await sb
    .from("designations")
    .select("metadata")
    .eq("id", u.id)
    .single();
  const next = { ...(row?.metadata ?? {}), tier_level: u.to };
  const { error } = await sb.from("designations").update({ metadata: next }).eq("id", u.id);
  if (error) console.log(`  ✗ ${u.abbr}: ${error.message}`);
}
console.log("Done.");
