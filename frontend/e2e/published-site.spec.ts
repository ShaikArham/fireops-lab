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

for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "iPhone-sized", width: 390, height: 844 },
]) {
  test(`published site: all seven routes and navigation on ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    for (const section of sections) {
      const response = await page.goto(`/workspace/${section}/`, {
        waitUntil: "domcontentloaded",
      });
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("main")).toBeVisible();
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }
    await page.goto("/workspace/overview/");
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
  const film = await request.get("/videos/fireops-introduction.mp4", {
    headers: { Range: "bytes=0-1023" },
  });
  expect([200, 206]).toContain(film.status());
  expect(film.headers()["content-type"]).toMatch(/video\/mp4|application\/octet-stream/);
  const captions = await request.get("/videos/fireops-captions.vtt");
  expect(captions.status()).toBe(200);
  const cv = await request.get("/Shaik_Arham_Saquib_Updated_Link.pdf", {
    headers: { Range: "bytes=0-1023" },
  });
  expect([200, 206]).toContain(cv.status());
  await page.goto("/");
  const video = page.locator("video");
  await expect(video).toBeVisible();
  await expect(video.locator("source")).toHaveAttribute(
    "src",
    "videos/fireops-introduction.mp4",
  );
  await expect(video).toHaveAttribute("controls", "");
  await expect(video).toHaveAttribute("playsinline", "");
});
