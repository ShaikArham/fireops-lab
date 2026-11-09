import { expect, test } from "@playwright/test";

test("approved application film is available and has playable metadata", async ({
  page,
  request,
}) => {
  const videoPath = "/videos/FireOPS_Lab_Speech_Aligned_Review_v2%20(1).mp4";
  const response = await request.get(videoPath);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toMatch(/video\/mp4|application\/octet-stream/);

  await page.goto("/");
  const video = page.locator("video");
  await expect(video).toBeVisible();
  await expect(video).toHaveAttribute("controls", "");
  await expect(video).toHaveAttribute("src", videoPath);
  await video.evaluate(async (element) => {
    const media = element as HTMLVideoElement;
    if (media.readyState < 1) {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Video metadata timed out")), 20_000);
        media.addEventListener(
          "loadedmetadata",
          () => {
            clearTimeout(timeout);
            resolve();
          },
          { once: true },
        );
        media.addEventListener(
          "error",
          () => {
            clearTimeout(timeout);
            reject(new Error("Video decode error"));
          },
          { once: true },
        );
      });
    }
  });
  const duration = await video.evaluate((element) => (element as HTMLVideoElement).duration);
  expect(duration).toBeGreaterThan(49);
  expect(duration).toBeLessThan(52);
});
