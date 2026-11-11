import { expect, test } from "@playwright/test";

const publishedBasePath = "/fireops-lab";

const sections = [
  "overview",
  "payments",
  "reconciliation",
  "investigations",
  "monitoring",
  "insights",
  "about",
] as const;

for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "iPhone-sized", width: 390, height: 844 },
]) {
  test(`published site: all seven routes and navigation on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    for (const section of sections) {
      const response = await page.goto(`${publishedBasePath}/workspace/${section}/`, {
        waitUntil: "domcontentloaded",
      });
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("main")).toBeVisible();
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }
    await page.goto(`${publishedBasePath}/workspace/overview/`);
    if (viewport.name === "iPhone-sized") {
      await page.locator("summary").filter({ hasText: "Sections" }).click();
      const nav = page.getByRole("navigation", { name: "Mobile workspace navigation" });
      for (const section of sections) {
        await expect(nav.locator(`a[href*="/workspace/${section}"]`)).toBeVisible();
      }
      await nav.getByRole("link", { name: "About the builder" }).click();
    } else {
      const nav = page.getByRole("navigation", { name: "Workspace navigation" });
      for (const section of sections) {
        await expect(nav.locator(`a[href*="/workspace/${section}"]`)).toBeVisible();
      }
      await nav.getByRole("link", { name: "About the builder" }).click();
    }
    await expect(page).toHaveURL(/\/workspace\/about\/?$/);
  });
}

test("published film, captions, and CV are reachable", async ({ page, request }) => {
  const film = await request.get(`${publishedBasePath}/videos/fireops-introduction.mp4`, {
    headers: { Range: "bytes=0-1023" },
  });
  expect([200, 206]).toContain(film.status());
  expect(film.headers()["content-type"]).toMatch(/video\/mp4|application\/octet-stream/);
  const captions = await request.get(`${publishedBasePath}/videos/fireops-captions.vtt`);
  expect(captions.status()).toBe(200);
  const cv = await request.get(`${publishedBasePath}/Shaik_Arham_Saquib.pdf`, {
    headers: { Range: "bytes=0-1023" },
  });
  expect([200, 206]).toContain(cv.status());
  await page.goto(`${publishedBasePath}/`);
  const video = page.locator("video");
  await expect(video).toBeVisible();
  await expect(video.locator("source")).toHaveAttribute("src", `${publishedBasePath}/videos/fireops-introduction.mp4`);
  await expect(video).toHaveAttribute("poster", `${publishedBasePath}/videos/fireops-thumbnail.svg`);
  await expect(video).toHaveAttribute("controls", "");
  await expect(video).toHaveAttribute("playsinline", "");
  await video.evaluate(async (element) => {
    const media = element as HTMLVideoElement;
    media.load();
    await new Promise<void>((resolve, reject) => {
      if (media.readyState >= 2) return resolve();
      media.addEventListener("loadeddata", () => resolve(), { once: true });
      media.addEventListener("error", () => reject(new Error("Video failed to load")), { once: true });
      setTimeout(() => reject(new Error("Video load timed out")), 20000);
    });
  });
});
