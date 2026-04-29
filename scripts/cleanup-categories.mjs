import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = readFileSync(".env.local", "utf8");
const get = (k) => {
  const m = env.match(new RegExp("^" + k + "=(.*)$", "m"));
  return m ? m[1].trim() : null;
};

const supabase = createClient(
  get("NEXT_PUBLIC_SUPABASE_URL"),
  get("SUPABASE_SERVICE_ROLE_KEY")
);

// Map slug → id once.
const { data: cats } = await supabase
  .from("categories")
  .select("id, slug, name");
const bySlug = Object.fromEntries(cats.map((c) => [c.slug, c]));

function id(slug) {
  if (!bySlug[slug]) throw new Error(`Unknown category slug: ${slug}`);
  return bySlug[slug].id;
}

// Course → target slug. Identified by exact title (or substring for the
// long ones) so the script is self-documenting.
const moves = [
  // from finance-banking
  ["Certified AI Powered Accountant", "finance"],
  ["Certified AI Strategy Professional Course", "ai"],
  ["Certified Cost Transformation Practitioner Course", "finance"],
  ["Certified Data Intelligence Professional Course", "data-analytics"],
  ["Certified Strategic Business Intelligence Partner Course", "strategy-&-leadership"],
  ["Certified Strategic Marketing Professional Course", "strategy-&-leadership"],
  ["Financial Statement Analysis Masterclass", "finance"],
  ["Investment Banking Fundamentals", "banking"],
  ["Islamic Finance and Sukuk", "banking"],
  ["Test", "finance"],
  // from data-analytics-ai
  ["Certified AI Finance Leader (CAIFL)", "ai"],
  ["Certified Data Intelligence for Professionals", "data-analytics"],
  ["Data Visualization with Power BI", "data-analytics"],
  ["Machine Learning in Banking", "ai"],
  ["Python for Financial Analysis", "data-analytics"],
  // from strategy-leadership (old)
  ["Digital Transformation in Banking", "strategy-&-leadership"],
  ["Strategic Leadership in Financial Services", "strategy-&-leadership"],
  // compliance-risk → all-courses
  ["Anti-Money Laundering Compliance", "all-courses"],
  ["Enterprise Risk Management Framework", "all-courses"],
];

console.log(`Reassigning ${moves.length} courses…`);
for (const [title, targetSlug] of moves) {
  const targetId = id(targetSlug);
  const { data, error } = await supabase
    .from("courses")
    .update({ category_id: targetId })
    .eq("title", title)
    .select("id, title");
  if (error) {
    console.log(`  ✗ ${title}  →  ${targetSlug}  :: ${error.message}`);
  } else if (!data || data.length === 0) {
    console.log(`  ⚠ ${title}  →  not found by exact title`);
  } else {
    console.log(`  ✓ ${title}  →  ${targetSlug}`);
  }
}

// Sanity check: nothing should remain in the to-be-deleted categories.
const toDelete = [
  "finance-banking",
  "data-analytics-ai",
  "strategy-leadership",
  "compliance-risk",
  "general",
];

console.log(`\nVerifying empty before delete…`);
for (const slug of toDelete) {
  const { count } = await supabase
    .from("courses")
    .select("*", { count: "exact", head: true })
    .eq("category_id", id(slug));
  console.log(`  ${slug}: ${count} courses remaining`);
  if (count > 0) {
    console.error(`  ✗ aborting — ${slug} still has courses`);
    process.exit(1);
  }
}

console.log(`\nDeleting ${toDelete.length} categories…`);
for (const slug of toDelete) {
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id(slug));
  if (error) {
    console.log(`  ✗ ${slug} :: ${error.message}`);
  } else {
    console.log(`  ✓ ${slug}`);
  }
}

console.log(`\nDone.`);
