import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./journey",
  workers: 1,
  timeout: 180_000,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "on",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: [
    {
      command: "uv run --directory ../backend uvicorn app.main:app --host 127.0.0.1 --port 8000",
      url: "http://127.0.0.1:8000/health",
      timeout: 120_000,
      env: {
        ...process.env,
        FIREOPS_ENV: "development",
        FIREOPS_ISOLATED_DEMO: "true",
        FIREOPS_PUBLIC_ORIGIN: "http://127.0.0.1:3000",
        FIREOPS_CORS_ORIGINS: "http://127.0.0.1:3000",
      },
    },
    {
      command: "npm run dev -- --hostname 127.0.0.1",
      url: "http://127.0.0.1:3000",
      timeout: 120_000,
      env: {
        ...process.env,

        NEXT_PUBLIC_API_BASE_URL: "http://127.0.0.1:8000",
        FIREOPS_API_PROXY: "http://127.0.0.1:8000",
      },
    },
  ],
});
