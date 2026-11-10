import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("https://api.fireops.test/api/v1/demo/**", (route) =>
    route.fulfill({
      json: { status: "ready", scenarios: [{ reconciliation_run_id: "layout-fixture" }] },
    }),
  );
});

const sections = [
  "overview",
  "payments",
  "reconciliation",
  "investigations",
  "monitoring",
  "insights",
  "about",
] as const;

test("homepage introduction leads into the seven-section workspace", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/FireOps Lab/i);
  await expect(page.getByRole("dialog", { name: /payment succeeds/i })).toBeVisible();
  await page.getByRole("link", { name: /Explore FireOPS/i }).click();
  await expect(page).toHaveURL(/\/workspace\/overview\/?$/);
  await expect(page.getByRole("heading", { level: 1, name: "Overview" })).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "Workspace navigation" })
      .getByRole("link", { name: "Payments" }),
  ).toBeVisible();
});

test("homepage discloses fictional records and independence", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/Fictional records only/i)).toBeVisible();
  await expect(page.getByText(/Not affiliated with fire.com/i)).toBeVisible();
});

for (const section of sections) {
  test(`guided ${section} route renders an accessible page heading`, async ({ page }) => {
    const response = await page.goto(`/workspace/${section}/`);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("Synthetic environment", { exact: true })).toBeVisible();
  });
}

test("scenario selection persists between workspace sections", async ({ page }) => {
  await page.goto("/workspace/payments/");
  await page.getByLabel("Guided scenario").selectOption("BATCH-N-20261014");
  await page.goto("/workspace/reconciliation/");
  await expect(page.getByLabel("Guided scenario")).toHaveValue("BATCH-N-20261014");
  await page.goto("/workspace/insights/");
  await expect(page.getByLabel("Guided scenario")).toHaveValue("BATCH-N-20261014");
});

test("small-screen navigation reaches About and remains within viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/workspace/overview/");
  await page.getByText("Sections", { exact: false }).click();
  await page
    .getByRole("navigation", { name: "Mobile workspace navigation" })
    .getByRole("link", { name: "About the builder" })
    .click();
  await expect(page).toHaveURL(/\/workspace\/about\/?$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeGreaterThanOrEqual(390);
});
