import { expect, test } from "@playwright/test";

test("keyboard navigation and reduced-motion accessibility on the workspace", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/workspace/about/");
  await expect(page.getByRole("heading", { level: 1, name: "About the builder" })).toBeVisible();
  const nav = page.getByRole("navigation", { name: "Workspace navigation" });
  const desktop = page.viewportSize()?.width ?? 1280;
  if (desktop >= 1024) {
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link", { name: "About the builder" })).toHaveAttribute("aria-current", "page");
  }
  const motion = await page.evaluate(() => ({
    media: matchMedia("(prefers-reduced-motion: reduce)").matches,
    scroll: getComputedStyle(document.documentElement).scrollBehavior,
    outline: getComputedStyle(document.querySelector("a") as Element).outlineStyle,
  }));
  expect(motion.media).toBe(true);
  expect(motion.scroll).toBe("auto");
  await page.keyboard.press("Tab");
  const focused = await page.evaluate(() => document.activeElement?.tagName);
  expect(["A", "BUTTON", "SUMMARY"]).toContain(focused);
});

test("mobile menu is keyboard operable and links to every workspace section", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/workspace/about/");
  const toggle = page.locator("summary", { hasText: "Workspaces" });
  await expect(toggle).toBeVisible();
  await toggle.focus();
  await page.keyboard.press("Enter");
  const menu = page.getByRole("navigation", { name: "Mobile workspace navigation" });
  await expect(menu).toBeVisible();
  for (const section of ["Overview", "Payments", "Reconciliation", "Investigations", "Monitoring", "Insights", "About the builder"]) {
    await expect(menu.getByRole("link", { name: section, exact: true })).toBeVisible();
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(overflow).toBeLessThanOrEqual(376);
});
