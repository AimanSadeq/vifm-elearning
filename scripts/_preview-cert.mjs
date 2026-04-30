// Generate a sample certificate using the same XML-substitution pipeline
// the production code uses, so we can open it in Keynote / PowerPoint and
// verify the placeholders were replaced.
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import PizZip from "pizzip";

const templatePath = path.join(
  process.cwd(),
  "src/lib/services/templates/vifm-classic.pptx"
);
const buffer = readFileSync(templatePath);
const zip = new PizZip(buffer);

const escapeXml = (s) =>
  (s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const data = {
  ATTENDEE_NAME: "Mohamed Mufid Bazbazat",
  COURSE_TITLE:
    "Data Analysis & Business Reporting Techniques Using Excel — Level 1",
  DATE_RANGE: new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }),
  CODE: "VIFM-26-DA-001",
  CLIENT_NAME: "VIFM Academy",
  CITY: "",
  COUNTRY: "",
  CLIENT_LOGO: "",
};

const replacements = Object.entries(data).map(([key, value]) => ({
  pattern: new RegExp(`\\{\\{${key}\\}\\}`, "g"),
  value: escapeXml(value),
}));

for (const filename of Object.keys(zip.files)) {
  if (
    !filename.endsWith(".xml") ||
    !(filename.includes("slides/") || filename.includes("slideLayouts/") || filename.includes("slideMasters/") || filename.includes("notesSlides/"))
  )
    continue;
  let xml = zip.files[filename].asText();
  let modified = false;
  for (const { pattern, value } of replacements) {
    const next = xml.replace(pattern, value);
    if (next !== xml) {
      xml = next;
      modified = true;
    }
  }
  if (modified) zip.file(filename, xml);
}

const out = zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
writeFileSync("/tmp/cert-preview.pptx", out);
console.log("Wrote /tmp/cert-preview.pptx");
