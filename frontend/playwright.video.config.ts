import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "walkthrough.spec.ts",
  outputDir: "../video/output/test-results",
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    video: { mode: "on", size: { width: 1600, height: 900 }, fps: 25 },
    trace: "retain-on-failure",
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
