import { expect, test } from "@playwright/test";

const routes = [
  "overview", "payments", "reconciliation", "investigations",
  "monitoring", "insights", "about",
] as const;

test("auto-seeded demo persists across the complete seven-section journey", async ({ page }) => {
  test.setTimeout(240_000);
  await page.goto("/workspace/payments/");
  await expect(page.getByRole("heading", { name: "Inspect the preloaded payment records" })).toBeVisible();
  await expect(page.getByText("Preparing your fictional payment workspace…")).toBeHidden({ timeout: 90_000 });
  await expect(page.locator("#operations").getByText("BATCH-E-20261015").first()).toBeVisible({ timeout: 90_000 });

  await page.goto("/workspace/overview/");
  await expect(page.getByRole("heading", { name: "Selected payment day" })).toBeVisible();
  await expect(page.getByText("Loading the selected scenario’s saved metrics…")).toBeHidden({ timeout: 60_000 });
  await expect(page.getByText("Next action")).toBeVisible();

  for (const route of routes) {
    await page.goto(`/workspace/${route}/`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }

  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      await page.goto(`/workspace/${route}/`);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth, `${route} at ${width}px`).toBeLessThanOrEqual(width + 1);
    }
  }
});
