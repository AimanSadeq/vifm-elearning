// Probe: confirm the bilingual title rule on courseSchema/moduleSchema/lessonSchema.
// Run from project root: npx tsx scripts/test-bilingual.mjs

import { courseSchema, moduleSchema, lessonSchema } from "../src/lib/utils/validators.ts";

const baseCourse = {
  categoryId: "00000000-0000-0000-0000-000000000001",
  difficultyLevel: "beginner",
  price: 0,
  currency: "USD",
  isFree: true,
  isFeatured: false,
  certificateEnabled: false,
  passingScore: 70,
};
const baseLesson = {
  contentType: "video",
  isPreview: false,
  isMandatory: true,
};
const baseModule = { isPreview: false };

const cases = [
  {
    name: "course: AR-only title is OK",
    schema: courseSchema,
    input: { ...baseCourse, titleAr: "مقدمة لإدارة المخاطر", descriptionAr: "وصف بالعربية فقط طويل بما يكفي" },
    expect: "ok",
  },
  {
    name: "course: EN-only title is OK",
    schema: courseSchema,
    input: { ...baseCourse, title: "Risk Management Intro", description: "An English-only description that is long enough." },
    expect: "ok",
  },
  {
    name: "course: no title in either language fails",
    schema: courseSchema,
    input: { ...baseCourse, description: "Some description that is long enough" },
    expect: "fail",
  },
  {
    name: "course: title present but description missing fails",
    schema: courseSchema,
    input: { ...baseCourse, title: "Ok Title" },
    expect: "fail",
  },

  {
    name: "module: AR-only OK",
    schema: moduleSchema,
    input: { ...baseModule, titleAr: "الوحدة الأولى" },
    expect: "ok",
  },
  {
    name: "module: empty fails",
    schema: moduleSchema,
    input: { ...baseModule },
    expect: "fail",
  },

  {
    name: "lesson: AR-only OK",
    schema: lessonSchema,
    input: { ...baseLesson, titleAr: "الدرس الأول" },
    expect: "ok",
  },
  {
    name: "lesson: EN-only OK",
    schema: lessonSchema,
    input: { ...baseLesson, title: "Lesson 1" },
    expect: "ok",
  },
  {
    name: "lesson: empty fails",
    schema: lessonSchema,
    input: { ...baseLesson },
    expect: "fail",
  },
  {
    name: "lesson: whitespace-only AR fails",
    schema: lessonSchema,
    input: { ...baseLesson, titleAr: "   " },
    expect: "fail",
  },
];

let passed = 0;
let failed = 0;
for (const c of cases) {
  const result = c.schema.safeParse(c.input);
  const ok = result.success;
  const matched = (ok && c.expect === "ok") || (!ok && c.expect === "fail");
  if (matched) {
    console.log(`PASS  ${c.name}`);
    passed++;
  } else {
    failed++;
    if (ok) {
      console.log(`FAIL  ${c.name} — expected fail, parsed OK`);
    } else {
      console.log(
        `FAIL  ${c.name} — expected ok, errors: ${JSON.stringify(result.error.issues.map((i) => `${i.path.join(".")}=${i.message}`))}`
      );
    }
  }
}
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
