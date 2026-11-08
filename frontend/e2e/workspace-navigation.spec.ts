import { expect, test } from "@playwright/test";

const workspaces = [
  "overview",
  "payments",
  "reconciliation",
  "investigations",
  "monitoring",
  "insights",
  "about",
] as const;

for (const section of workspaces) {
  test(`workspace ${section} renders without a server error`, async ({ page }) => {
    const response = await page.goto(`/workspace/${section}`);
    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole("heading", {
        name: section === "about" ? "About the builder" : new RegExp(`^${section}$`, "i"),
        level: 1,
      }),
    ).toBeVisible();
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByText("Synthetic environment", { exact: true })).toBeVisible();
  });
}

test("desktop sidebar routes to payments and investigations", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/workspace/overview");
  const nav = page.getByRole("navigation", { name: "Workspace navigation" });
  await nav.getByRole("link", { name: "Payments" }).click();
  await expect(page).toHaveURL(/\/workspace\/payments\/?$/);
  await nav.getByRole("link", { name: "Investigations" }).click();
  await expect(page).toHaveURL(/\/workspace\/investigations\/?$/);
});

test("mobile menu navigates and remains usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/workspace/overview");
  await page.getByText("☰ Workspaces").click();
  await page
    .getByRole("navigation", { name: "Mobile workspace navigation" })
    .getByRole("link", { name: "About the builder" })
    .click();
  await expect(page).toHaveURL(/\/workspace\/about\/?$/);
  await expect(page.getByRole("heading", { name: "About the builder", level: 1 })).toBeVisible();
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(390);
});

test("about section discloses synthetic data and independence", async ({ page }) => {
  await page.goto("/workspace/about");
  await expect(page.getByText(/fictional records/)).toBeVisible();
  await expect(page.getByText(/not connected to Fire Financial Services Limited/)).toBeVisible();
});
