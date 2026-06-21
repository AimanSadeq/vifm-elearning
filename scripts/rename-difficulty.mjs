// One-off: rename difficulty enum VALUES in code + translations.
//   beginner -> gateway, intermediate -> professional, advanced -> executive
// Only rewrites quoted standalone tokens ("beginner" / 'beginner'), which in
// this codebase are always the difficulty value (verified by grep). Unquoted
// object keys are fixed by hand afterwards. Run: node scripts/rename-difficulty.mjs [--apply]
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const APPLY = process.argv.includes("--apply");
const MAP = [
  ["beginner", "gateway"],
  ["intermediate", "professional"],
  ["advanced", "executive"],
];

const targets = ["messages/en.json", "messages/ar.json"];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(name)) targets.push(p);
  }
})("src");

let totalHits = 0;
const touched = [];
for (const file of targets) {
  const src = readFileSync(file, "utf8");
  let out = src;
  let hits = 0;
  for (const [from, to] of MAP) {
    for (const q of ['"', "'"]) {
      const needle = `${q}${from}${q}`;
      const repl = `${q}${to}${q}`;
      const parts = out.split(needle);
      hits += parts.length - 1;
      out = parts.join(repl);
    }
  }
  if (hits > 0) {
    totalHits += hits;
    touched.push(`${file}  (${hits})`);
    if (APPLY) writeFileSync(file, out);
  }
}

console.log(`${APPLY ? "APPLIED" : "DRY-RUN"}: ${totalHits} quoted tokens in ${touched.length} files`);
for (const t of touched) console.log("  " + t);
