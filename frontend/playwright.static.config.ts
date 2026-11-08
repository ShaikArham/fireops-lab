import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./static-e2e",
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:3100/fireops-lab/", trace: "retain-on-failure" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: "python3 -m http.server 3100 --bind 127.0.0.1 --directory .qa-site",
    url: "http://127.0.0.1:3100/fireops-lab/",
    timeout: 30000,
  },
});
