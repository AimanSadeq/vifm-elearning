import { test, expect } from "@playwright/test";

const CATEGORY_SLUGS = [
  "finance-banking",
  "data-analytics-ai",
  "strategy-leadership",
  "compliance-risk",
];

test.describe("Landing page", () => {
  test.setTimeout(90_000);

  test("category cards navigate to correct URLs", async ({ page }) => {
    for (const slug of CATEGORY_SLUGS) {
      await page.goto("/en", { timeout: 30_000 });
      await page.waitForLoadState("domcontentloaded");
      const link = page.locator(`a[href="/en/categories/${slug}"]`);
      await link.scrollIntoViewIfNeeded();
      await link.click();
      await expect(page).toHaveURL(`/en/categories/${slug}`, {
        timeout: 15_000,
      });
    }
  });

  test("footer legal links navigate correctly", async ({ page }) => {
    await page.goto("/en", { timeout: 30_000 });
    await page.waitForLoadState("domcontentloaded");

    // Privacy Policy
    const privacyLink = page.locator('footer a[href="/en/privacy-policy"]');
    await privacyLink.scrollIntoViewIfNeeded();
    await privacyLink.click();
    await expect(page).toHaveURL("/en/privacy-policy", { timeout: 15_000 });

    // Terms of Service
    await page.goto("/en", { timeout: 30_000 });
    await page.waitForLoadState("domcontentloaded");
    const termsLink = page.locator('footer a[href="/en/terms-of-service"]');
    await termsLink.scrollIntoViewIfNeeded();
    await termsLink.click();
    await expect(page).toHaveURL("/en/terms-of-service", { timeout: 15_000 });
  });

  test("Arabic locale renders correctly", async ({ page }) => {
    await page.goto("/ar", { timeout: 30_000 });
    await page.waitForLoadState("domcontentloaded");

    // Hero heading in Arabic
    await expect(
      page.getByRole("heading", { name: /طوّر مسيرتك المهنية/ })
    ).toBeVisible({ timeout: 15_000 });

    // Categories section heading in Arabic: "تصفح حسب الفئة"
    const catHeading = page.getByRole("heading", { name: /تصفح حسب الفئة/ });
    await catHeading.scrollIntoViewIfNeeded();
    await expect(catHeading).toBeVisible();

    // All 4 Arabic category names
    const arabicCategories = [
      "المالية والمصرفية",
      "تحليل البيانات والذكاء الاصطناعي",
      "الاستراتيجية والقيادة",
      "الامتثال وإدارة المخاطر",
    ];
    for (const name of arabicCategories) {
      await expect(
        page.getByRole("heading", { name, exact: true })
      ).toBeVisible();
    }

    // "Why VIFM" heading in Arabic (may be lazy-loaded below fold)
    const whyVifmAr = page.getByRole("heading", { name: /لماذا أكاديمية/ });
    if ((await whyVifmAr.count()) > 0) {
      await whyVifmAr.scrollIntoViewIfNeeded();
      await expect(whyVifmAr).toBeVisible({ timeout: 10_000 });
    }
  });
});
