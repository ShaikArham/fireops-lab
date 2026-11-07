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

test("static reconciliation preview compares synthetic source records side by side", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Compare every payment with its settlement" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "AMOUNT MISMATCH" })).toBeVisible();
  await expect(page.getByText("Payment instruction", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Settlement record", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("DUPLICATE CANDIDATE").first()).toBeVisible();
});

test("API-backed reconciliation selects two batches and shows saved comparison", async ({
  page,
}) => {
  await page.route("https://api.fireops.test/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/batches")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          batches: [{ batch_id: "BATCH-QA-1", control_totals: [] }],
          settlement_batches: [{ settlement_batch_id: "SETTLE-QA-1", control_totals: [] }],
        }),
      });
    } else if (url.pathname.endsWith("/reconciliation/runs")) {
      const request = route.request().postDataJSON() as Record<string, string>;
      expect(request.payment_batch_id).toBe("BATCH-QA-1");
      expect(request.settlement_batch_id).toBe("SETTLE-QA-1");
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          run_id: "run-qa-1",
          payment_batch_id: "BATCH-QA-1",
          settlement_batch_id: "SETTLE-QA-1",
          matched_count: 1,
          unmatched_count: 0,
          exception_count: 0,
          result_count: 1,
          classification_counts: { MATCHED_EXACT: 1 },
          results: [
            {
              classification: "MATCHED_EXACT",
              difference_minor: 0,
              explanation_code: "REFERENCE_AMOUNT_DATE_WINDOW",
              payment: {
                payment_id: "PAY-QA-1",
                client_reference: "REF-QA-1",
                amount_minor: 1250,
                currency: "EUR",
                expected_settlement_date: "2026-10-15",
              },
              settlement: {
                settlement_id: "SET-QA-1",
                payment_reference: "REF-QA-1",
                amount_minor: 1250,
                currency: "EUR",
                settlement_date: "2026-10-15",
              },
            },
          ],
        }),
      });
    } else {
      await route.fulfill({ status: 404, body: "Not found" });
    }
  });

  await page.goto("/");
  await page.getByLabel("Payment batch").selectOption("BATCH-QA-1");
  await page.getByLabel("Settlement batch").selectOption("SETTLE-QA-1");
  await page.getByRole("button", { name: "Run reconciliation" }).click();
  await expect(page.getByText("Saved run run-qa-1")).toBeVisible();
  await expect(page.getByText("PAY-QA-1")).toBeVisible();
  await expect(page.getByText("SET-QA-1")).toBeVisible();
});

test("an exception is assigned, investigated, resolved, and retained in its audit trail", async ({
  page,
}) => {
  const activities: Array<Record<string, string | null>> = [];
  let currentStatus = "OPEN";
  let assignedTo: string | null = null;
  const caseData = () => ({
    case_id: "CASE-QA-1",
    result_id: "RESULT-QA-1",
    run_id: "RUN-QA-1",
    classification: "AMOUNT_MISMATCH",
    status: currentStatus,
    priority: "NORMAL",
    assigned_to: assignedTo,
    payment: { payment_id: "PAY-QA-1", amount_minor: 1250, currency: "EUR" },
    settlement: { settlement_id: "SET-QA-1", amount_minor: 1200, currency: "EUR" },
    activities: activities.map((activity, index) => ({
      activity_id: `ACT-${index}`,
      activity_type: activity.type,
      occurred_at: "2026-11-07T12:00:00Z",
      actor: activity.actor,
      reason: activity.reason,
      from_value: activity.from,
      to_value: activity.to,
      correlation_id: `CORR-${index}`,
    })),
  });

  await page.route("https://api.fireops.test/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname.endsWith("/batches")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          batches: [{ batch_id: "BATCH-QA-1" }],
          settlement_batches: [{ settlement_batch_id: "SETTLE-QA-1" }],
        }),
      });
    } else if (url.pathname.endsWith("/reconciliation/runs")) {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          run_id: "RUN-QA-1",
          payment_batch_id: "BATCH-QA-1",
          settlement_batch_id: "SETTLE-QA-1",
          matched_count: 0,
          unmatched_count: 0,
          exception_count: 1,
          result_count: 1,
          classification_counts: { AMOUNT_MISMATCH: 1 },
          results: [
            {
              result_id: "RESULT-QA-1",
              classification: "AMOUNT_MISMATCH",
              difference_minor: -50,
              explanation_code: "AMOUNT_DIFFERENCE",
              payment: {
                payment_id: "PAY-QA-1",
                client_reference: "REF-QA-1",
                amount_minor: 1250,
                currency: "EUR",
                expected_settlement_date: "2026-10-15",
              },
              settlement: {
                settlement_id: "SET-QA-1",
                payment_reference: "REF-QA-1",
                amount_minor: 1200,
                currency: "EUR",
                settlement_date: "2026-10-15",
              },
            },
          ],
        }),
      });
    } else if (url.pathname.endsWith("/cases") && request.method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          cases: activities.length ? [caseData()] : [],
          limit: 25,
          offset: 0,
        }),
      });
    } else if (url.pathname.endsWith("/cases") && request.method() === "POST") {
      activities.push({
        type: "CREATED",
        actor: "demo-analyst",
        reason: null,
        from: null,
        to: "OPEN",
      });
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(caseData()),
      });
    } else if (url.pathname.endsWith("/assignment")) {
      assignedTo = (request.postDataJSON() as { assigned_to: string }).assigned_to;
      activities.push({
        type: "ASSIGNED",
        actor: "demo-analyst",
        reason: null,
        from: null,
        to: assignedTo,
      });
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(caseData()),
      });
    } else if (url.pathname.endsWith("/notes")) {
      const body = request.postDataJSON() as { note: string };
      activities.push({
        type: "NOTE_ADDED",
        actor: "demo-analyst",
        reason: body.note,
        from: null,
        to: null,
      });
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(caseData()),
      });
    } else if (url.pathname.endsWith("/transitions")) {
      const body = request.postDataJSON() as { target_status: string; reason?: string };
      const previous = currentStatus;
      currentStatus = body.target_status;
      activities.push({
        type: currentStatus === "RESOLVED" ? "RESOLVED" : "STATUS_CHANGED",
        actor: "demo-analyst",
        reason: body.reason ?? null,
        from: previous,
        to: currentStatus,
      });
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(caseData()),
      });
    } else {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Not found" }),
      });
    }
  });

  await page.goto("/");
  await page.getByLabel("Payment batch").selectOption("BATCH-QA-1");
  await page.getByLabel("Settlement batch").selectOption("SETTLE-QA-1");
  await page.getByRole("button", { name: "Run reconciliation" }).click();
  await page.getByRole("button", { name: "Open investigation case" }).click();
  await expect(page.getByRole("heading", { name: "Case investigation" })).toBeVisible();
  await page.getByLabel("Assign to analyst").fill("analyst.two");
  await page.getByRole("button", { name: "Assign", exact: true }).click();
  await page
    .getByLabel("Investigation note")
    .fill("Source evidence shows a 50 minor-unit difference.");
  await page.getByRole("button", { name: "Add note" }).click();
  await page.getByRole("button", { name: "Start review" }).click();
  await page
    .getByLabel("Action reason")
    .fill("Operations confirmed the variance in the settlement source.");
  await page.getByRole("button", { name: "Resolve case" }).click();
  const audit = page.getByRole("list", { name: "Case audit history" });
  await expect(audit.getByText("CREATED", { exact: true })).toBeVisible();
  await expect(audit.getByText("ASSIGNED", { exact: true })).toBeVisible();
  await expect(audit.getByText("NOTE ADDED", { exact: true })).toBeVisible();
  await expect(audit.getByText("RESOLVED", { exact: true })).toBeVisible();
  await expect(audit.getByText("Source evidence shows a 50 minor-unit difference.")).toBeVisible();
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
