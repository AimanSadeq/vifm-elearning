// One-off: remove em dash (—, U+2014) from PROSE UI text only.
//
// Uses the TypeScript tokenizer so it ONLY touches string / template / JSX-text
// tokens — comments and regex literals are never modified. Standalone "—"
// placeholders (e.g. an empty rating cell) are kept. "Remove entirely":
// "A — B" -> "A B" (horizontal whitespace collapsed; newlines preserved).
//
// Run: node scripts/strip-emdash.mjs [--apply]
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import tsmod from "typescript";
const ts = tsmod.default ?? tsmod;

const APPLY = process.argv.includes("--apply");
const EM = "—";

const STRINGY = new Set([
  ts.SyntaxKind.StringLiteral,
  ts.SyntaxKind.NoSubstitutionTemplateLiteral,
  ts.SyntaxKind.TemplateHead,
  ts.SyntaxKind.TemplateMiddle,
  ts.SyntaxKind.TemplateTail,
  ts.SyntaxKind.JsxText,
]);

// Replace em dashes in one token's raw text. null = leave unchanged.
function fixToken(raw) {
  if (!raw.includes(EM)) return null;
  const inner = raw.replace(/^['"`]+|['"`]+$/g, "").trim();
  if (inner === EM) return null; // standalone placeholder — keep
  const fixed = raw.replace(/[ \t]*—[ \t]*/g, " ");
  return fixed === raw ? null : fixed;
}

function processTsFile(file) {
  const text = readFileSync(file, "utf8");
  const sf = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  const edits = []; // { start, end, replacement }
  const visit = (node) => {
    if (STRINGY.has(node.kind)) {
      const start = node.getStart(sf);
      const end = node.getEnd();
      const raw = text.slice(start, end);
      const fixed = fixToken(raw);
      if (fixed !== null) edits.push({ start, end, raw, fixed });
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);

  if (!edits.length) return { hits: 0, out: text, edits };
  let out = text;
  // Apply from the end so earlier offsets stay valid.
  for (const e of [...edits].sort((a, b) => b.start - a.start)) {
    out = out.slice(0, e.start) + e.fixed + out.slice(e.end);
  }
  const hits = edits.reduce((s, e) => s + (e.raw.match(/—/g) || []).length, 0);
  return { hits, out, edits };
}

// JSON has no comments / regex; em dashes only live in prose string values.
function processJsonFile(file) {
  const text = readFileSync(file, "utf8");
  if (!text.includes(EM)) return { hits: 0, out: text };
  const hits = (text.match(/—/g) || []).length;
  const out = text.replace(/[ \t]*—[ \t]*/g, " ");
  return { hits, out };
}

const tsTargets = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(name)) tsTargets.push(p);
  }
})("src");

let totalHits = 0;
let totalFiles = 0;
const samples = [];

for (const file of ["messages/en.json", "messages/ar.json"]) {
  const { hits, out } = processJsonFile(file);
  if (hits > 0) {
    totalHits += hits;
    totalFiles++;
    if (APPLY) writeFileSync(file, out);
  }
}

for (const file of tsTargets) {
  const { hits, out, edits } = processTsFile(file);
  if (hits > 0) {
    totalHits += hits;
    totalFiles++;
    for (const e of edits.slice(0, 2)) {
      if (samples.length < 16)
        samples.push({ file, before: e.raw.slice(0, 80), after: e.fixed.slice(0, 80) });
    }
    if (APPLY) writeFileSync(file, out);
  }
}

console.log(`${APPLY ? "APPLIED" : "DRY-RUN"}: ${totalHits} em dashes across ${totalFiles} files`);
for (const s of samples) {
  console.log(`\n[${s.file}]\n  before: ${s.before}\n  after:  ${s.after}`);
}
