import { expect, test } from "@playwright/test";
import path from "node:path";

test("home page presents the independent fictional-data boundary", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/FireOps Lab/);
  await expect(page.getByRole("heading", { name: /Reconcile the day/i })).toBeVisible();
  await expect(page.getByText("Fictional data only")).toBeVisible();
  await expect(page.getByText(/not affiliated with, commissioned by, endorsed by/i)).toBeVisible();
});

test("project boundaries explain the simulator", async ({ page }) => {
  await page.goto("/#method");

  await expect(page.getByRole("heading", { name: "Method and limits" })).toBeVisible();
  await expect(page.getByText(/not be presented as proven fraud/i)).toBeVisible();
});

test("CSV preview, idempotent batch controls, and processing history work together", async ({
  page,
}) => {
  let processed = false;
  await page.route("https://api.fireops.test/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() === "OPTIONS") {
      await route.fulfill({
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "http://127.0.0.1:3000",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "content-type",
        },
      });
      return;
    }
    let body: unknown;

    if (url.pathname.endsWith("/source-files/preview")) {
      body = {
        kind: "payment_instructions",
        checksum_sha256: "a".repeat(64),
        data_row_count: 1,
        is_valid: true,
        issues_truncated: false,
        issues: [],
        preview: [
          {
            payment_id: "PAY-QA-0001",
            client_reference: "REF-QA-0001",
            created_at: "2026-11-07T08:00:00Z",
            instructed_at: "2026-11-07T08:01:00Z",
            amount_minor: 1250,
            currency: "EUR",
          },
        ],
      };
    } else if (url.pathname.includes("/source-files/import/")) {
      body = {
        source_file_id: "source-qa-1",
        source_type: "PAYMENT_INSTRUCTION",
        checksum_sha256: "a".repeat(64),
        row_count: 1,
        imported_count: 1,
        idempotent: false,
      };
    } else if (url.pathname.endsWith("/batches")) {
      body = {
        batches: [
          {
            batch_id: "BATCH-QA-1",
            control_totals: [
              {
                currency: "EUR",
                direction: "OUTBOUND",
                status: processed ? "SETTLED" : "CREATED",
                record_count: 1,
                total_minor: 1250,
              },
            ],
          },
        ],
        settlement_batches: processed
          ? [
              {
                settlement_batch_id: "SIMB-QA-1",
                control_totals: [
                  {
                    currency: "EUR",
                    direction: "OUTBOUND",
                    record_count: 1,
                    total_minor: 1250,
                  },
                ],
              },
            ]
          : [],
      };
    } else if (url.pathname.endsWith("/simulate")) {
      const idempotent = processed;
      processed = true;
      body = {
        batch_id: "BATCH-QA-1",
        processed_count: idempotent ? 0 : 3,
        settled_count: idempotent ? 0 : 1,
        failed_count: 0,
        settlement_count: idempotent ? 0 : 1,
        settlement_totals_minor: { EUR: 1250 },
        idempotent,
      };
    } else if (url.pathname.endsWith("/payments")) {
      body = {
        batch_id: "BATCH-QA-1",
        limit: 25,
        payments: [
          {
            payment_id: "PAY-QA-0001",
            client_reference: "REF-QA-0001",
            status: processed ? "SETTLED" : "CREATED",
            amount_minor: 1250,
            currency: "EUR",
            direction: "OUTBOUND",
          },
        ],
      };
    } else if (url.pathname.endsWith("/events")) {
      body = {
        events: ["IMPORTED", "VALIDATED", "PROCESSING", "SETTLED"].map((event_type, index) => ({
          event_id: `event-${index}`,
          event_type,
          occurred_at: `2026-11-07T08:0${index}:00Z`,
          actor: "system:simulation",
          metadata: {},
        })),
      };
    } else {
      await route.fulfill({ status: 404, body: "Not found" });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });

  await page.goto("/");
  const fixturePath = path.resolve(
    process.cwd(),
    "../data/synthetic/normal_day/payment_instructions.csv",
  );
  await page.getByLabel("CSV file").setInputFiles(fixturePath);
  await page.getByRole("button", { name: "Preview file" }).click();
  await expect(page.getByText(/1 rows passed validation/)).toBeVisible();
  await page.getByRole("button", { name: "Import validated file" }).click();
  await expect(page.getByText(/Imported 1 records atomically/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "BATCH-QA-1" })).toBeVisible();
  await page.getByRole("button", { name: "Inspect batch" }).click();
  await expect(
    page.getByRole("heading", { name: "Processing history · BATCH-QA-1" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Simulate processing" }).click();
  await expect(page.getByText(/1 settled and 0 failed/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "SIMB-QA-1" })).toBeVisible();
  await page.getByRole("button", { name: "Simulate processing" }).click();
  await expect(page.getByText(/already processed. No records or totals changed/)).toBeVisible();
  await page.getByRole("button", { name: "View event history" }).click();
  const history = page.getByRole("list", { name: "Event history for PAY-QA-0001" });
  await expect(history.getByText("IMPORTED", { exact: true })).toBeVisible();
  await expect(history.getByText("SETTLED", { exact: true })).toBeVisible();
});
