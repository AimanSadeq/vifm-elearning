import { test, expect } from "@playwright/test";

const CATEGORY_SLUGS = [
  "finance-banking",
  "data-analytics-ai",
  "strategy-leadership",
  "compliance-risk",
];

test.describe("Landing page", () => {
  test("category cards navigate to correct URLs", async ({ page }) => {
    test.setTimeout(60_000);

    for (const slug of CATEGORY_SLUGS) {
      await page.goto("/en");
      await page.waitForLoadState("networkidle");
      const link = page.locator(`a[href="/en/categories/${slug}"]`);
      await link.scrollIntoViewIfNeeded();
      await link.click();
      await expect(page).toHaveURL(`/en/categories/${slug}`, {
        timeout: 10_000,
      });
    }
  });

  test("footer legal links navigate correctly", async ({ page }) => {
    await page.goto("/en");
    await page.waitForLoadState("networkidle");

    // Privacy Policy
    const privacyLink = page.locator('footer a[href="/en/privacy-policy"]');
    await privacyLink.scrollIntoViewIfNeeded();
    await privacyLink.click();
    await expect(page).toHaveURL("/en/privacy-policy", { timeout: 10_000 });

    // Terms of Service
    await page.goto("/en");
    await page.waitForLoadState("networkidle");
    const termsLink = page.locator('footer a[href="/en/terms-of-service"]');
    await termsLink.scrollIntoViewIfNeeded();
    await termsLink.click();
    await expect(page).toHaveURL("/en/terms-of-service", { timeout: 10_000 });
  });

  test("Arabic locale renders correctly", async ({ page }) => {
    await page.goto("/ar");

    // Hero heading in Arabic
    await expect(page.getByRole("heading", { name: /طوّر مسيرتك المهنية/ })).toBeVisible();

    // Categories section heading in Arabic
    await expect(page.getByRole("heading", { name: "التصنيفات" })).toBeVisible();

    // All 4 Arabic category names
    const arabicCategories = [
      "المالية والمصرفية",
      "تحليل البيانات والذكاء الاصطناعي",
      "الاستراتيجية والقيادة",
      "الامتثال وإدارة المخاطر",
    ];
    for (const name of arabicCategories) {
      await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
    }

    // "Why VIFM" heading in Arabic
    await expect(page.getByRole("heading", { name: /لماذا أكاديمية VIFM؟/ })).toBeVisible();

    // At least one feature name in Arabic
    await expect(page.getByText("مدربون خبراء")).toBeVisible();
  });
});
