import { expect, test } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

test("record the full synthetic payment operations website walkthrough", async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Reconcile the day/i })).toBeVisible();
  await expect(page.getByText("Fictional data only")).toBeVisible();
  await page.waitForTimeout(8_000);

  await page.locator("#operations").scrollIntoViewIfNeeded();
  await expect(
    page.getByRole("heading", { name: "Import, process, and inspect a sample batch" }),
  ).toBeVisible();
  const paymentCsv = path.resolve(
    process.cwd(),
    "../data/synthetic/exception_day/payment_instructions.csv",
  );
  const settlementCsv = path.resolve(
    process.cwd(),
    "../data/synthetic/exception_day/settlement_records.csv",
  );
  const operations = page.locator("#operations");
  await operations.getByLabel("CSV file").setInputFiles(paymentCsv);
  await operations.getByRole("button", { name: "Preview file" }).click();
  await expect(operations.getByText(/1,250 rows passed validation/)).toBeVisible();
  await operations.getByRole("button", { name: "Import validated file" }).click();
  await expect(operations.getByText(/Imported 1,250 records atomically/)).toBeVisible();
  await operations.getByLabel("Source type").selectOption("settlement_records");
  await operations.getByLabel("CSV file").setInputFiles(settlementCsv);
  await operations.getByRole("button", { name: "Preview file" }).click();
  await expect(operations.getByText(/1,230 rows passed validation/)).toBeVisible();
  await operations.getByRole("button", { name: "Import validated file" }).click();
  await expect(operations.getByText(/Imported 1,230 records atomically/)).toBeVisible();
  const normalPaymentCsv = path.resolve(
    process.cwd(),
    "../data/synthetic/normal_day/payment_instructions.csv",
  );
  await operations.getByLabel("Source type").selectOption("payment_instructions");
  await operations.getByLabel("CSV file").setInputFiles(normalPaymentCsv);
  await operations.getByRole("button", { name: "Preview file" }).click();
  await expect(operations.getByText(/100 rows passed validation/)).toBeVisible();
  await operations.getByRole("button", { name: "Import validated file" }).click();
  await expect(operations.getByText(/Imported 100 records atomically/)).toBeVisible();
  await page.waitForTimeout(6_000);

  const normalBatch = operations.locator("article").filter({ hasText: "BATCH-N-20261014" });
  await normalBatch.getByRole("button", { name: "Inspect batch" }).click();
  await normalBatch.getByRole("button", { name: "Simulate processing" }).click();
  await expect(operations.getByText(/Simulation complete: .* settled and .* failed/)).toBeVisible({
    timeout: 60_000,
  });
  await page.waitForTimeout(6_000);

  await page.getByRole("link", { name: "Payment day" }).click();
  await expect(
    page.getByRole("heading", { name: "Compare every payment with its settlement" }),
  ).toBeVisible();
  await page.getByLabel("Payment batch").first().selectOption("BATCH-E-20261015");
  await page.getByLabel("Settlement batch").selectOption("SETTLE-E-20261016");
  await page.getByRole("button", { name: "Run reconciliation" }).click();
  await expect(page.getByText("1,260 results", { exact: false })).toBeVisible();
  await expect(page.getByRole("heading", { name: "AMOUNT MISMATCH" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "DUPLICATE CANDIDATE" })).toBeVisible();
  await page.waitForTimeout(8_000);

  await page.locator("#case-heading").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Open investigation case" }).first().click();
  await expect(page.getByRole("heading", { name: "Case investigation" })).toBeVisible();
  await page.getByLabel("Assign to analyst").fill("demo-analyst");
  await page.getByRole("button", { name: "Assign", exact: true }).click();
  await page
    .getByLabel("Investigation note")
    .fill("Compared the synthetic payment and settlement evidence.");
  await page.getByRole("button", { name: "Add note" }).click();
  await page.getByRole("button", { name: "Start review" }).click();
  await page.getByLabel("Action reason").fill("Recorded the source variance for follow-up.");
  await page.getByLabel("Resolution root cause").selectOption("SOURCE_DATA_QUALITY");
  await page.getByRole("button", { name: "Resolve case" }).click();
  await expect(page.getByRole("list", { name: "Case audit history" })).toContainText("RESOLVED");
  await page.waitForTimeout(7_000);

  await page.getByRole("link", { name: "Monitoring" }).click();
  await expect(
    page.getByRole("heading", { name: "Review explainable operational alerts" }),
  ).toBeVisible();
  await page.getByLabel("Synthetic payment batch").selectOption("BATCH-E-20261015");
  await page.getByRole("button", { name: "Run monitoring rules" }).click();
  await expect(page.getByText(/rule alerts created/)).toBeVisible();
  await page.locator('[aria-label="Monitoring alert queue"] button').first().click();
  await page.getByRole("button", { name: "Start review" }).last().click();
  await page
    .getByLabel("Analyst note")
    .fill("Reviewed the synthetic rule evidence and benign explanations.");
  await page.getByRole("button", { name: "Add note" }).click();
  await page.getByLabel("Review reason").fill("Request a second-person operational review.");
  await page.getByRole("button", { name: "Escalate for review" }).click();
  await page.getByRole("button", { name: "View simulated escalation summary" }).click();
  await expect(page.getByRole("article", { name: "Simulated escalation summary" })).toContainText(
    "not a suspicious activity report",
  );
  await page.waitForTimeout(7_000);

  await page.reload();
  await expect(page.getByRole("heading", { name: /Reconcile the day/i })).toBeVisible();
  await page.getByRole("link", { name: "Insights" }).click();
  await expect(
    page.getByRole("heading", { name: "Measure the payment day and review workload" }),
  ).toBeVisible();
  await expect(page.getByText("Report source")).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download this run’s CSV" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.csv$/);
  await page.waitForTimeout(7_000);

  await page.getByRole("link", { name: "About and method" }).click();
  await expect(page.getByRole("heading", { name: "Method and limits" })).toBeVisible();
  await expect(page.getByText(/not affiliated with, commissioned by, endorsed by/i)).toBeVisible();
  await page.waitForTimeout(8_000);

  const recording = page.video();
  expect(recording).not.toBeNull();
  const outputPath = path.resolve(
    process.cwd(),
    "../video/output/phase10-site-walkthrough-capture.webm",
  );
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await page.close();
  await recording?.saveAs(outputPath);
});
