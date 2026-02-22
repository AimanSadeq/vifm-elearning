import { test, expect } from "@playwright/test";

const CATEGORY_SLUGS = [
  "finance-banking",
  "data-analytics-ai",
  "strategy-leadership",
  "compliance-risk",
];

test.describe("Landing page", () => {
  test("category cards navigate to correct URLs", async ({ page }) => {
    await page.goto("/en");

    for (const slug of CATEGORY_SLUGS) {
      await page.goto("/en");
      const link = page.locator(`a[href="/en/categories/${slug}"]`);
      await link.click();
      await expect(page).toHaveURL(`/en/categories/${slug}`);
    }
  });

  test("footer legal links navigate correctly", async ({ page }) => {
    await page.goto("/en");

    // Privacy Policy
    const privacyLink = page.locator('footer a[href="/en/privacy-policy"]');
    await privacyLink.click();
    await expect(page).toHaveURL("/en/privacy-policy");

    // Terms of Service
    await page.goto("/en");
    const termsLink = page.locator('footer a[href="/en/terms-of-service"]');
    await termsLink.click();
    await expect(page).toHaveURL("/en/terms-of-service");
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
