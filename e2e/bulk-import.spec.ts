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

const ADMIN_EMAIL = "asadeq@viftraining.com";
const ADMIN_PASS = "BulkTest123!";

const TEST_EMAILS = [
  "bulktest1@example.com",
  "bulktest2@example.com",
  "bulktest3@example.com",
  "bulktest4@example.com",
];

test.describe("Bulk Import Wizard", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let adminClient: any;

  // This test needs more time for the import process
  test.setTimeout(90_000);

  test.beforeAll(async () => {
    adminClient = createClient(SUPABASE_URL, SERVICE_KEY);

    // Set a known password for the admin
    const { data: admin } = await adminClient
      .from("profiles")
      .select("id")
      .eq("email", ADMIN_EMAIL)
      .single();
    if (admin) {
      await adminClient.auth.admin.updateUserById(admin.id, {
        password: ADMIN_PASS,
      });
    }

    // Pre-cleanup: remove any leftover test users from previous runs
    for (const email of TEST_EMAILS) {
      const { data: prof } = await adminClient
        .from("profiles")
        .select("id")
        .eq("email", email)
        .single();
      if (prof) {
        await adminClient.auth.admin.deleteUser(prof.id);
      }
    }
  });

  test.afterAll(async () => {
    // Cleanup: delete test users and vouchers
    for (const email of TEST_EMAILS) {
      const { data: prof } = await adminClient
        .from("profiles")
        .select("id")
        .eq("email", email)
        .single();
      if (prof) {
        await adminClient.auth.admin.deleteUser(prof.id);
      }
    }

    // Delete bulk vouchers created during test
    const { data: vouchers } = await adminClient
      .from("vouchers")
      .select("id, code")
      .like("code", "BULK-%");
    if (vouchers) {
      for (const v of vouchers) {
        await adminClient
          .from("voucher_redemptions")
          .delete()
          .eq("voucher_id", v.id);
        await adminClient.from("vouchers").delete().eq("id", v.id);
      }
    }
  });

  test("full wizard flow: upload, configure, review, import", async ({
    page,
  }) => {
    // ── Sign in ─────────────────────────────────────────────
    await page.goto("/en/login");
    await page.locator("#email").fill(ADMIN_EMAIL);
    await page.locator("#password").fill(ADMIN_PASS);
    await page.getByRole("button", { name: /sign in|log in/i }).click();

    // Wait for redirect to dashboard
    await page.waitForURL(/\/en\/admin|\/en\/dashboard|\/en$/, {
      timeout: 15000,
    });

    // ── Navigate to admin users page ────────────────────────
    await page.goto("/en/admin/users");

    // Wait for the Bulk Import button to appear (page is loaded)
    const bulkBtn = page.getByRole("button", { name: /bulk import/i });
    await expect(bulkBtn).toBeVisible({ timeout: 15000 });

    await page.screenshot({
      path: "e2e/screenshots/bulk-00-users-page.png",
      fullPage: true,
    });

    // ── Open Bulk Import dialog ─────────────────────────────
    await bulkBtn.click();

    // Wait for dialog to appear
    await expect(page.getByText("Bulk Import Users")).toBeVisible();
    await page.screenshot({
      path: "e2e/screenshots/bulk-01-step1-empty.png",
    });

    // ── Step 1: Upload CSV ──────────────────────────────────
    const csvPath = path.resolve("test-bulk-import.csv");
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(csvPath);

    // Wait for parsing and verify preview shows correct counts
    await expect(page.getByText("4 valid")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("2 invalid")).toBeVisible();

    await page.screenshot({
      path: "e2e/screenshots/bulk-02-step1-parsed.png",
    });

    // Click Next
    await page.getByRole("button", { name: "Next", exact: true }).click();

    // ── Step 2: Configure ───────────────────────────────────
    await expect(page.getByText("Access Expires At")).toBeVisible({
      timeout: 5000,
    });

    await page.screenshot({
      path: "e2e/screenshots/bulk-03-step2-configure.png",
    });

    // Select a course (first checkbox in the course list)
    const courseCheckbox = page
      .locator('input[type="checkbox"]')
      .first();
    await courseCheckbox.check();

    // Verify summary text appears
    await expect(page.getByText(/4 users/i)).toBeVisible();

    await page.screenshot({
      path: "e2e/screenshots/bulk-04-step2-selected.png",
    });

    // Click Next
    await page.getByRole("button", { name: "Next", exact: true }).click();

    // ── Step 3: Review ──────────────────────────────────────
    await expect(page.getByText(/import summary/i)).toBeVisible();
    await expect(page.getByText(/users to import/i)).toBeVisible();

    // Warning about skipped rows
    await expect(page.getByText(/2 invalid/i)).toBeVisible();

    await page.screenshot({
      path: "e2e/screenshots/bulk-05-step3-review.png",
    });

    // Click Import
    await page.getByRole("button", { name: /import users/i }).click();

    // ── Step 4: Results ─────────────────────────────────────
    // Wait for import to complete (voucher code appears)
    await expect(page.getByText(/voucher code/i)).toBeVisible({
      timeout: 45000,
    });

    // Verify voucher code is shown
    const voucherCode = page.locator("code");
    await expect(voucherCode).toBeVisible();
    const code = await voucherCode.textContent();
    expect(code).toMatch(/^BULK-/);

    await page.screenshot({
      path: "e2e/screenshots/bulk-06-step4-results.png",
    });

    // Click Send Welcome Email
    const emailBtn = page.getByRole("button", {
      name: /send welcome email/i,
    });
    await expect(emailBtn).toBeVisible();
    await emailBtn.click();

    // Wait for email success toast
    await expect(page.getByText(/welcome emails sent/i)).toBeVisible({
      timeout: 10000,
    });

    await page.screenshot({
      path: "e2e/screenshots/bulk-07-step4-email-sent.png",
    });

    // Close the dialog
    await page.getByRole("button", { name: "Close", exact: true }).first().click();

    // Verify dialog is closed
    await expect(page.getByText("Bulk Import Users")).not.toBeVisible();

    // Verify one of the imported users appears in the table
    await expect(page.getByText("bulktest1@example.com")).toBeVisible({
      timeout: 10000,
    });

    await page.screenshot({
      path: "e2e/screenshots/bulk-08-users-updated.png",
      fullPage: true,
    });
  });
});
