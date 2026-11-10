import { expect, test } from "@playwright/test";
import fs from "node:fs/promises";
const api = process.env.LIVE_API_URL ?? "http://127.0.0.1:8000";
const prefix = process.env.LIVE_SITE_URL ? "/fireops-lab" : "";
const route = (section: string) => `${prefix}/workspace/${section}/`;

test("real cross-origin payment, case, monitoring and export workflow", async ({ page, browser }, testInfo) => {
  test.setTimeout(300_000);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  const timings: Record<string, number> = {};
  const capture = async (name: string) => {
    const file = testInfo.outputPath(`${name}.png`);
    await page.screenshot({ path: file });
    await testInfo.attach(name, { path: file, contentType: "image/png" });
  };
  await page.setViewportSize({ width: 1440, height: 900 });
  let started = Date.now();
  await page.goto(route("overview"));
  await expect(page.locator('section[aria-label="Live operational overview"]')).toBeVisible({ timeout: 120_000 });
  await expect(page.getByText("1,250", { exact: true })).toBeVisible({ timeout: 30_000 });
  timings.coldWorkspaceMs = Date.now() - started;
  await capture("01-overview");

  started = Date.now();
  await page.goto(route("payments"));
  await page.getByLabel("Choose a fictional payment batch").selectOption("BATCH-N-20261014");
  await expect(page.getByText("PAY-N-0001", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Simulate processing", exact: true }).click();
  await expect(page.getByText(/Simulation complete:/)).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "View event history" }).first().click();
  await expect(page.getByRole("list", { name: /Event history/ })).toContainText("SETTLED");
  timings.paymentMs = Date.now() - started;
  await capture("02-payments");
  await page.getByRole("button", { name: "Next payments" }).click();
  await expect(page.getByText("PAY-N-0026", { exact: true })).toBeVisible();

  await page.getByLabel("Guided scenario").selectOption("BATCH-E-20261015");
  await page.goto(route("reconciliation"));
  await page.getByLabel("Payment batch", { exact: true }).selectOption("BATCH-E-20261015");
  await page.getByLabel("Settlement batch").selectOption("SETTLE-E-20261016");
  await page.getByRole("button", { name: "Run reconciliation" }).click();
  await expect(page.getByText(/1,?260 results/)).toBeVisible({ timeout: 30_000 });
  await capture("03-reconciliation");
  await page.getByRole("button", { name: "Open investigation case", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Case investigation" })).toBeVisible();
  await page.getByLabel("Assign to analyst").fill("demo-reviewer");
  await page.getByRole("button", { name: "Assign", exact: true }).click();
  await page.getByLabel("Investigation note").fill("Compared the fictional source records and documented the settlement variance.");
  await page.getByRole("button", { name: "Add note", exact: true }).click();
  await page.getByRole("button", { name: "Start review", exact: true }).click();
  await page.getByLabel("Action reason").fill("Documented the source variance for follow-up and a second review.");
  await page.getByLabel("Resolution root cause").selectOption("SOURCE_DATA_QUALITY");
  await page.getByRole("button", { name: "Resolve case", exact: true }).click();
  await expect(page.getByRole("list", { name: "Case audit history" })).toContainText("RESOLVED");
  await capture("04-investigation");

  await page.goto(route("monitoring"));
  const monitoring = page.locator("#monitoring");
  await monitoring.getByLabel("Synthetic payment batch").selectOption("BATCH-E-20261015");
  await monitoring.getByRole("button", { name: "Run monitoring rules" }).click();
  await monitoring.locator('[aria-label="Monitoring alert queue"] button').first().click();
  await monitoring.getByRole("button", { name: "Start review", exact: true }).click();
  await monitoring.getByLabel("Analyst note").fill("Reviewed the rule evidence and possible benign explanations.");
  await monitoring.getByRole("button", { name: "Add note", exact: true }).click();
  await monitoring.getByLabel("Review reason").fill("Request a second-person operational review.");
  await monitoring.getByRole("button", { name: "Escalate for review" }).click();
  await monitoring.getByRole("button", { name: "View simulated escalation summary" }).click();
  await expect(page.getByRole("article", { name: "Simulated escalation summary" })).toContainText("not a suspicious activity report");
  await capture("05-monitoring");

  await page.goto(route("insights"));
  await expect(page.getByText("Report source", { exact: true })).toBeVisible();
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download this run’s CSV" }).click();
  const download = await pending;
  const file = await download.path();
  expect(file).not.toBeNull();
  expect(await fs.readFile(file!, "utf8")).toContain("metric");
  await capture("06-insights");
  await page.goto(route("investigations"));
  await page.getByLabel("Filter cases by status").selectOption("RESOLVED");
  await expect(page.getByRole("list", { name: "Exception case queue" })).toContainText("RESOLVED");
  await page.reload();
  await page.getByLabel("Filter cases by status").selectOption("RESOLVED");
  await expect(page.getByRole("list", { name: "Exception case queue" })).toContainText("RESOLVED");

  // A second visitor receives a fresh token; known identifiers remain inaccessible.
  const token = await page.evaluate(() => sessionStorage.getItem("fireops-demo-access-token"));
  expect(token).toBeTruthy();
  const ownResponse = await page.request.get(`${api}/api/v1/cases?status=RESOLVED`, { headers: { Authorization: `Bearer ${token}` } });
  expect(ownResponse.ok()).toBe(true);
  const own = await ownResponse.json();
  expect(own.cases.length).toBeGreaterThan(0);
  const second = await browser.newContext();
  const secondPage = await second.newPage();
  await secondPage.goto(new URL(route("overview"), page.url()).href);
  await expect(secondPage.locator('section[aria-label="Live operational overview"]')).toBeVisible({ timeout: 120_000 });
  const otherToken = await secondPage.evaluate(() => sessionStorage.getItem("fireops-demo-access-token"));
  expect(otherToken).toBeTruthy();
  expect(otherToken).not.toBe(token);
  const foreign = await secondPage.request.get(`${api}/api/v1/cases/${own.cases[0].case_id}`, { headers: { Authorization: `Bearer ${otherToken}` } });
  expect(foreign.status()).toBe(404);
  await second.close();

  for (const section of ["overview", "payments", "reconciliation", "investigations", "monitoring", "insights", "about"]) {
    await page.goto(route(section));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    if (section === "overview") await expect(page.locator('section[aria-label="Live operational overview"]')).toBeVisible();
    for (const width of [360, 390, 430, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth), `${section} at ${width}px`).toBeLessThanOrEqual(width + 1);
    }
  }
  await expect(page.getByRole("link", { name: /View code on GitHub/i })).toHaveAttribute("href", "https://github.com/ShaikArham/fireops-lab");
  await capture("07-about");
  expect(errors).toEqual([]);
  await fs.writeFile(testInfo.outputPath("timings.json"), JSON.stringify(timings, null, 2));
});
