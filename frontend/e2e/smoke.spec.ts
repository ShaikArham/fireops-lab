import { expect, test } from "@playwright/test";

const sections = [
  "overview",
  "payments",
  "reconciliation",
  "investigations",
  "monitoring",
  "insights",
  "about",
] as const;

test("landing page communicates its purpose and links to the guided workspace", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/FireOps Lab/i);
  await expect(page.getByRole("heading", { name: "Every payment tells a story." })).toBeVisible();
  await expect(page.getByRole("link", { name: /explore|enter|start/i }).first()).toBeVisible();
});

test("landing page discloses that its records are fictional", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/fictional payment day/i).first()).toBeVisible();
  await expect(page.getByText(/does not move money, connect to banking systems/i)).toBeVisible();
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
  await page.getByText("☰ Workspaces").click();
  await page.getByRole("navigation", { name: "Mobile workspace navigation" })
    .getByRole("link", { name: "About the builder" }).click();
  await expect(page).toHaveURL(/\/workspace\/about\/?$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
