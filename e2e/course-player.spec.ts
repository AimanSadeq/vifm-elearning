import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { readFileSync } from "fs";

// Load .env.local for Supabase credentials
const envPath = path.resolve(__dirname, "..", ".env.local");
const envContent = readFileSync(envPath, "utf-8");
const envVars: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  envVars[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
}

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;

const LEARNER_EMAIL = "james.wilson@gmail.com";
const LEARNER_PASS = "PlayerTest123!";
const COURSE_SLUG = "financial-statement-analysis-masterclass";

test.describe.serial("Course Player — video, document, quiz flow", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let adminClient: ReturnType<typeof createClient>;
  let courseId: string;
  let lessonIds: { video: string; document: string; quiz: string };

  test.setTimeout(120_000);

  test.beforeAll(async () => {
    adminClient = createClient(SUPABASE_URL, SERVICE_KEY);

    // Set a known password for the learner
    const { data: learner } = await adminClient
      .from("profiles")
      .select("id")
      .eq("email", LEARNER_EMAIL)
      .single();

    if (!learner) throw new Error("Learner user not found — run seed first");

    await adminClient.auth.admin.updateUserById(learner.id, {
      password: LEARNER_PASS,
    });

    // Fetch the course
    const { data: course } = await adminClient
      .from("courses")
      .select("id")
      .eq("slug", COURSE_SLUG)
      .single();

    if (!course) throw new Error("Course not found — run seed first");
    courseId = course.id;

    // Fetch module 1 lessons (sort_order asc) — video(0), document(1), quiz(2)
    const { data: modules } = await adminClient
      .from("modules")
      .select("id")
      .eq("course_id", courseId)
      .order("sort_order")
      .limit(1);

    const moduleId = modules?.[0]?.id;
    if (!moduleId) throw new Error("Module not found");

    const { data: lessons } = await adminClient
      .from("lessons")
      .select("id, content_type")
      .eq("module_id", moduleId)
      .order("sort_order");

    if (!lessons || lessons.length < 3) throw new Error("Lessons not found");

    lessonIds = {
      video: lessons.find((l) => l.content_type === "video")!.id,
      document: lessons.find((l) => l.content_type === "document")!.id,
      quiz: lessons.find((l) => l.content_type === "quiz")!.id,
    };

    // Ensure enrollment exists and set total_lesson_items
    const { data: allLessons } = await adminClient
      .from("lessons")
      .select("id")
      .eq("course_id", courseId);

    const totalItems = allLessons?.length ?? 0;

    await adminClient.from("enrollments").upsert(
      {
        user_id: learner.id,
        course_id: courseId,
        status: "active",
        total_lesson_items: totalItems,
        completed_lesson_ids: [],
        completed_lesson_items: 0,
        progress_percentage: 0,
      },
      { onConflict: "user_id,course_id" }
    );

    // Clear any existing progress and quiz attempts for a clean test
    await adminClient
      .from("lesson_progress")
      .delete()
      .eq("user_id", learner.id)
      .eq("course_id", courseId);

    // Clear quiz attempts for all quizzes in this course
    const { data: quizzes } = await adminClient
      .from("quizzes")
      .select("id")
      .eq("course_id", courseId);

    if (quizzes) {
      for (const q of quizzes) {
        await adminClient
          .from("quiz_attempts")
          .delete()
          .eq("quiz_id", q.id)
          .eq("user_id", learner.id);
      }
    }
  });

  test("full learner flow: video → document → quiz → completion", async ({
    page,
  }) => {
    // ── 1. Login ──────────────────────────────────────────
    await page.goto("/en/login");
    await page.getByLabel(/email/i).fill(LEARNER_EMAIL);
    await page.getByLabel(/password/i).fill(LEARNER_PASS);
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await page.waitForURL(
      (url) => url.pathname.startsWith("/en") && !url.pathname.includes("/login"),
      { timeout: 15_000 }
    );

    // ── 2. Navigate to video lesson ────────────────────────
    await page.goto(
      `/en/courses/${COURSE_SLUG}/learn/${lessonIds.video}`
    );

    // Verify video player rendered
    await expect(
      page.locator("video, .video-player, [data-testid='video-player']")
    ).toBeVisible({ timeout: 15_000 });

    // Verify lesson title is visible
    await expect(page.locator("h1")).toBeVisible();

    // Mark video lesson as complete (video lessons auto-complete on
    // playback end; we call the server API to avoid full playback)
    const completeRes = await page.request.post(
      `/api/lessons/${lessonIds.video}/complete`,
      { data: { courseId } }
    );
    expect(completeRes.ok()).toBe(true);

    // ── 3. Navigate to document lesson ─────────────────────
    await page.goto(
      `/en/courses/${COURSE_SLUG}/learn/${lessonIds.document}`
    );

    // Verify PDF iframe rendered
    const iframe = page.locator("iframe");
    await expect(iframe).toBeVisible({ timeout: 10_000 });
    await expect(iframe).toHaveAttribute("src", /pdf|document/i);

    // Verify "Open in new tab" link exists
    await expect(page.getByText(/open in new tab/i)).toBeVisible();

    // Verify "Mark as Complete" button exists
    const markCompleteBtn = page.getByRole("button", {
      name: /mark as complete/i,
    });
    await expect(markCompleteBtn).toBeVisible();

    // Click Mark as Complete
    await markCompleteBtn.click();

    // Wait for the button to disappear and "Completed" badge to show
    await expect(markCompleteBtn).not.toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/completed/i).first()).toBeVisible();

    // Wait for network to settle (sendBeacon fires on navigation)
    await page.waitForTimeout(1_000);

    // ── 4. Navigate to quiz lesson ─────────────────────────
    await page.goto(
      `/en/courses/${COURSE_SLUG}/learn/${lessonIds.quiz}`
    );

    // Verify quiz gate rendered with quiz info
    await expect(
      page.getByRole("button", { name: /start quiz|retry quiz/i })
    ).toBeVisible({ timeout: 15_000 });

    // Verify quiz metadata is shown
    await expect(page.getByText(/questions/i)).toBeVisible();
    await expect(page.getByText(/pass/i)).toBeVisible();

    // Start the quiz
    await page.getByRole("button", { name: /start quiz|retry quiz/i }).click();

    // ── 5. Answer quiz questions ───────────────────────────
    // Course 0, Module 1 quiz: "Financial Reporting Quiz"
    // Q1 correct: "Budget Forecast" (index 2)
    // Q2 correct: "A snapshot of assets, liabilities, and equity" (index 1)
    // Q3 correct: "Liabilities plus Shareholders' Equity" (index 1)

    // Wait for first question to load
    await expect(page.locator(".space-y-2 button").first()).toBeVisible({
      timeout: 5_000,
    });

    // Q1: Click the correct answer "Budget Forecast"
    await page
      .locator("button", { hasText: "Budget Forecast" })
      .click();

    // Click Next (quiz nav button — exact match to avoid "Next Lesson" and Next.js devtools)
    await page.getByRole("button", { name: "Next", exact: true }).click();

    // Q2: Click the correct answer
    await page
      .locator("button", {
        hasText: "A snapshot of assets, liabilities, and equity",
      })
      .click();

    // Click Next (quiz nav button — exact match to avoid "Next Lesson" and Next.js devtools)
    await page.getByRole("button", { name: "Next", exact: true }).click();

    // Q3: Click the correct answer
    await page
      .locator("button", {
        hasText: "Liabilities plus Shareholders' Equity",
      })
      .click();

    // Submit quiz
    await page.getByRole("button", { name: "Submit Quiz" }).click();

    // ── 6. Verify quiz results ─────────────────────────────
    // Should show "Congratulations!" and passed status
    await expect(
      page.getByRole("heading", { name: /congratulations/i })
    ).toBeVisible({ timeout: 10_000 });

    await expect(page.getByText(/100%|passed/i).first()).toBeVisible();

    // ── 7. Verify quiz lesson marked complete in sidebar ────
    // The quiz lesson should now show a completed checkmark in the sidebar
    // The sidebar shows CheckCircle2 icons for completed lessons
    // Navigate back to document lesson to verify it still shows as completed too
    await page.goto(
      `/en/courses/${COURSE_SLUG}/learn/${lessonIds.document}`
    );

    // The document lesson should still show as completed (badge visible)
    await expect(page.getByText(/completed/i).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("Arabic locale renders translated strings", async ({ page }) => {
    // Login via English first (more reliable selectors), then switch to Arabic
    await page.goto("/en/login");
    await page.getByLabel(/email/i).fill(LEARNER_EMAIL);
    await page.getByLabel(/password/i).fill(LEARNER_PASS);
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await page.waitForURL(
      (url) => url.pathname.startsWith("/en") && !url.pathname.includes("/login"),
      { timeout: 15_000 }
    );

    // Navigate to document lesson in Arabic locale
    await page.goto(
      `/ar/courses/${COURSE_SLUG}/learn/${lessonIds.document}`
    );
    await page.waitForLoadState("networkidle");

    // Verify Arabic document UI strings
    await expect(
      page.getByText("فتح في تبويب جديد")
    ).toBeVisible({ timeout: 15_000 });

    // Verify navigation buttons are in Arabic
    await expect(
      page.getByRole("button", { name: /السابق|الدرس التالي/ }).first()
    ).toBeVisible();

    // Navigate to quiz lesson in Arabic
    await page.goto(
      `/ar/courses/${COURSE_SLUG}/learn/${lessonIds.quiz}`
    );
    await page.waitForLoadState("networkidle");

    // Verify Arabic quiz UI strings — either start or retry depending on prior test state
    await expect(
      page.getByRole("button", { name: /ابدأ الاختبار|أعد الاختبار/ })
    ).toBeVisible({ timeout: 15_000 });
  });
});
