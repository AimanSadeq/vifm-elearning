// Import every row of `Course tiers.xlsx` into the `designations` table so
// `/admin/certifications` shows them all. Matches existing rows by parsed
// abbreviation or normalized name to avoid duplicates; inserts otherwise.
// Run dry by default; pass --commit to apply.
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

// ---------- 1. Parse the spreadsheet ----------
const wb = XLSX.read(
  readFileSync("/Users/asaadalsharif/Downloads/Course tiers.xlsx"),
  { type: "buffer" }
);
const rawRows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
  defval: "",
});

function normalize(s) {
  if (!s) return "";
  return String(s)
    .normalize("NFKD")
    // Strip Unicode combining marks only — `\p{M}` catches Latin diacritics
    // and Arabic harakat without eating base Arabic letters. The earlier
    // hand-written range `[̀-ًͯ-ٟ]` mistakenly spanned U+0300–U+064B,
    // which also matches every Arabic letter (U+0600–U+064A).
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/[^a-z0-9؀-ۿ]+/g, " ")
    .trim();
}

/**
 * Extract an acronym from a name. Prefers a short alphanumeric blob inside
 * the last parens ("CERTIFIED AI-POWERED ACCOUNTANT (CAPA)" → "CAPA"). If
 * that fails (e.g. Arabic-named rows whose parenthetical holds the full
 * English title), build initials from the first letter of each significant
 * word — first inside the parens (English content), then the rest of the
 * name. Last resort returns "CERT" so we never hand back an empty string.
 */
function deriveAbbreviation(name) {
  const m = name.match(/\(([^)]*)\)\s*$/);
  if (m) {
    const inside = m[1].replace(/[^A-Za-z0-9]/g, "");
    if (inside.length >= 2 && inside.length <= 12) return inside.toUpperCase();
    const innerInitials = m[1]
      .split(/\s+/)
      .filter((w) => w.length >= 3 && /^[A-Za-z]/.test(w))
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 8);
    if (innerInitials.length >= 2) return innerInitials;
  }
  const words = name
    .replace(/\([^)]*\)/g, "")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && /[A-Za-z]/.test(w));
  const initials = words
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 8);
  return initials || "CERT";
}

function deriveSlug(abbr, name) {
  const base = (abbr || name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || `cert-${Math.random().toString(36).slice(2, 8)}`;
}

const fileEntries = [];
const seenKey = new Set();
for (const row of rawRows) {
  const keys = Object.keys(row);
  if (keys.length < 2) continue;
  const name = String(row[keys[0]] ?? "").trim();
  const tier = String(row[keys[1]] ?? "").trim().toLowerCase();
  if (!name || name.toLowerCase() === "course name") continue;
  if (!["gateway", "professional", "executive"].includes(tier)) continue;
  const key = normalize(name);
  if (seenKey.has(key)) continue; // dedupe accidental dupes in the file
  seenKey.add(key);
  fileEntries.push({ name, tier });
}
console.log(`Parsed ${fileEntries.length} unique spreadsheet rows.`);

// ---------- 2. Pull existing designations ----------
const { data: existing } = await sb
  .from("designations")
  .select("id, name, name_ar, abbreviation, slug, metadata, is_active");

const byAbbr = new Map();
const byNameKey = new Map();
for (const d of existing ?? []) {
  if (d.abbreviation) byAbbr.set(d.abbreviation.toUpperCase(), d);
  if (d.name) byNameKey.set(normalize(d.name), d);
  if (d.name_ar) byNameKey.set(normalize(d.name_ar), d);
}

const usedSlugs = new Set((existing ?? []).map((d) => d.slug).filter(Boolean));
function uniqueSlug(s) {
  let candidate = s;
  let i = 2;
  while (usedSlugs.has(candidate)) candidate = `${s}-${i++}`;
  usedSlugs.add(candidate);
  return candidate;
}

// `designations.abbreviation` is unique in the DB — track allocations across
// existing rows + planned inserts so two new rows don't collide.
const usedAbbr = new Set(
  (existing ?? []).map((d) => d.abbreviation?.toUpperCase()).filter(Boolean)
);
function uniqueAbbr(base) {
  const b = base.toUpperCase();
  if (!usedAbbr.has(b)) {
    usedAbbr.add(b);
    return b;
  }
  for (let i = 2; i < 100; i++) {
    const c = `${b}${i}`;
    if (!usedAbbr.has(c)) {
      usedAbbr.add(c);
      return c;
    }
  }
  return `${b}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

// ---------- 3. Plan ----------
const updates = [];
const inserts = [];
for (const e of fileEntries) {
  const abbr = deriveAbbreviation(e.name);
  // Match by *normalized name* primarily — that's the most distinctive
  // signal. Fall back to abbreviation only when the abbreviation was
  // extracted directly from a parenthetical (the high-confidence form like
  // "(CAPA)"). Initial-derived abbreviations can collide between unrelated
  // rows (Level 1 / Level 2 of the same course series both derive
  // "DARUELA"), so we don't trust them for matching.
  const parenAbbrMatch = e.name.match(/\(([A-Z][A-Z0-9]{1,11})\)\s*$/);
  const parensExtractedAbbr = parenAbbrMatch ? parenAbbrMatch[1] : null;
  const matched =
    byNameKey.get(normalize(e.name)) ||
    (parensExtractedAbbr ? byAbbr.get(parensExtractedAbbr) : null);
  if (matched) {
    const currentTier = matched.metadata?.tier_level ?? null;
    if (currentTier !== e.tier || !matched.is_active) {
      updates.push({
        id: matched.id,
        abbr: matched.abbreviation,
        name: matched.name,
        from: currentTier,
        to: e.tier,
        wasInactive: !matched.is_active,
      });
    }
  } else {
    const finalAbbr = uniqueAbbr(abbr);
    const slug = uniqueSlug(deriveSlug(finalAbbr, e.name));
    inserts.push({ name: e.name, abbreviation: finalAbbr, slug, tier: e.tier });
  }
}

// ---------- 4. Report ----------
console.log(`\nUPDATES (${updates.length}):`);
for (const u of updates) {
  const wake = u.wasInactive ? "  [reactivate]" : "";
  console.log(`  ${u.abbr.padEnd(10)} ${u.from ?? "—"} → ${u.to}${wake}  (${u.name})`);
}
console.log(`\nINSERTS (${inserts.length}):`);
for (const u of inserts)
  console.log(`  ${u.abbreviation.padEnd(10)} ${u.tier.padEnd(12)} ${u.name}`);

if (!COMMIT) {
  console.log("\n(dry run — pass --commit to apply)");
  process.exit(0);
}

// ---------- 5. Apply ----------
console.log("\nApplying…");
for (const u of updates) {
  const { data: row } = await sb
    .from("designations")
    .select("metadata")
    .eq("id", u.id)
    .single();
  const next = { ...(row?.metadata ?? {}), tier_level: u.to };
  const { error } = await sb
    .from("designations")
    .update({ metadata: next, is_active: true })
    .eq("id", u.id);
  if (error) console.log(`  ✗ ${u.abbr}: ${error.message}`);
}

for (const u of inserts) {
  const { error } = await sb.from("designations").insert({
    name: u.name,
    abbreviation: u.abbreviation,
    slug: u.slug,
    description: "",
    annual_cpe_required: 20,
    founding_fee: 0,
    renewal_fee: 0,
    late_fee: 0,
    reinstatement_fee: 0,
    currency: "USD",
    grace_period_months: 3,
    is_active: true,
    metadata: { tier_level: u.tier },
  });
  if (error) console.log(`  ✗ ${u.abbreviation}: ${error.message}`);
}
console.log("Done.");
