import { expect, test } from "@playwright/test";
import fs from "node:fs/promises";

test("published sample has working assets, download, navigation and honest capabilities", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("./");
  await expect(page.getByText("Public sample edition.", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "The work behind my application" })).toBeVisible();
  const link = page.getByRole("link", { name: "Download sample summary CSV" });
  const href = await link.getAttribute("href");
  const response = await page.request.get(new URL(href ?? "", page.url()).href);
  expect(response.ok()).toBe(true);
  const csv = await response.text();
  expect(csv).toContain("payment_instruction_count,1250");
  expect(csv).toContain("MATCHED_EXACT,1218");
  const downloadEvent = page.waitForEvent("download");
  await link.click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe("sample-reconciliation-summary.csv");
  expect(await fs.readFile((await download.path()) ?? "", "utf8")).toBe(csv);
  for (const asset of [
    "videos/fireops-lab-walkthrough.mp4",
    "videos/fireops-lab-walkthrough.vtt",
    "videos/fireops-lab-walkthrough-thumbnail.webp",
  ]) {
    expect((await page.request.get(new URL(asset, page.url()).href)).ok()).toBe(true);
  }
  const ids = await page
    .locator("[id]")
    .evaluateAll((elements) => elements.map((element) => element.id));
  expect(new Set(ids).size).toBe(ids.length);
  for (const href of await page
    .locator('a[href^="#"]')
    .evaluateAll((links) => links.map((link) => link.getAttribute("href") ?? ""))) {
    expect(ids).toContain(href.slice(1));
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("./");
  await page.screenshot({ path: testInfo.outputPath("desktop.png") });
  for (const width of [320, 375, 390, 768, 1024]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: testInfo.outputPath("mobile.png") });
  const menu = page.getByRole("button", { name: "Explore sections" });
  await menu.click();
  await page
    .getByRole("navigation", { name: "Main sections" })
    .getByRole("link", { name: "About and method" })
    .click();
  await expect(page).toHaveURL(/#method$/);
  await expect(page.getByRole("button", { name: "Explore sections" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await expect(page.locator("#method")).toBeFocused();
  await menu.click();
  await page
    .getByRole("navigation", { name: "Main sections" })
    .getByRole("link", { name: "Monitoring", exact: true })
    .focus();
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe(
    "auto",
  );
  expect(errors).toEqual([]);
});
