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
  await expect(page.getByText(/not presented as proven fraud/i)).toBeVisible();
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
  await page.getByLabel("Payment batch").first().selectOption("BATCH-QA-1");
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
  let rootCause: string | null = null;
  const caseData = () => ({
    case_id: "CASE-QA-1",
    result_id: "RESULT-QA-1",
    run_id: "RUN-QA-1",
    classification: "UNMATCHED_INSTRUCTION",
    status: currentStatus,
    priority: "NORMAL",
    assigned_to: assignedTo,
    root_cause: rootCause,
    payment: { payment_id: "PAY-QA-1", amount_minor: 1250, currency: "EUR" },
    settlement: null,
    activities: activities.map((activity, index) => ({
      activity_id: `ACT-${index}`,
      activity_type: activity.type,
      occurred_at: "2026-11-07T12:00:00Z",
      actor: activity.actor,
      reason: activity.reason,
      root_cause: activity.root_cause ?? null,
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
          unmatched_count: 1,
          exception_count: 1,
          result_count: 1,
          classification_counts: { UNMATCHED_INSTRUCTION: 1 },
          results: [
            {
              result_id: "RESULT-QA-1",
              classification: "UNMATCHED_INSTRUCTION",
              difference_minor: null,
              explanation_code: "NO_SETTLEMENT_REFERENCE",
              payment: {
                payment_id: "PAY-QA-1",
                client_reference: "REF-QA-1",
                amount_minor: 1250,
                currency: "EUR",
                expected_settlement_date: "2026-10-15",
              },
              settlement: null,
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
      const body = request.postDataJSON() as {
        target_status: string;
        reason?: string;
        root_cause?: string;
      };
      const previous = currentStatus;
      currentStatus = body.target_status;
      rootCause = body.root_cause ?? null;
      activities.push({
        type: currentStatus === "RESOLVED" ? "RESOLVED" : "STATUS_CHANGED",
        actor: "demo-analyst",
        reason: body.reason ?? null,
        from: previous,
        to: currentStatus,
        root_cause: rootCause,
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
  await page.getByLabel("Payment batch").first().selectOption("BATCH-QA-1");
  await page.getByLabel("Settlement batch").selectOption("SETTLE-QA-1");
  await page.getByRole("button", { name: "Run reconciliation" }).click();
  await expect(page.getByRole("heading", { name: "UNMATCHED INSTRUCTION" })).toBeVisible();
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
  await page.getByLabel("Resolution root cause").selectOption("SOURCE_DATA_QUALITY");
  await page.getByRole("button", { name: "Resolve case" }).click();
  const audit = page.getByRole("list", { name: "Case audit history" });
  await expect(audit.getByText("CREATED", { exact: true })).toBeVisible();
  await expect(audit.getByText("ASSIGNED", { exact: true })).toBeVisible();
  await expect(audit.getByText("NOTE ADDED", { exact: true })).toBeVisible();
  await expect(audit.getByText("RESOLVED", { exact: true })).toBeVisible();
  await expect(audit.getByText("Root cause: SOURCE DATA QUALITY", { exact: true })).toBeVisible();
  await expect(audit.getByText("Source evidence shows a 50 minor-unit difference.")).toBeVisible();
});

test("operational insights use one saved run and export its report", async ({ page }) => {
  await page.route("https://api.fireops.test/api/v1/insights/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/insights/latest")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          run_id: "run-insights-1",
          payment_batch_id: "BATCH-QA-1",
          settlement_batch_id: "SETTLE-QA-1",
          generated_at: "2026-11-07T12:00:00Z",
          metrics: {
            payment_count: 125,
            settled_payment_count: 120,
            matched_exact_count: 100,
            exact_match_rate_pct: 80,
            unmatched_instruction_count: 10,
            unmatched_settlement_count: 5,
            exception_result_count: 20,
            exception_review_value_by_currency_minor: { EUR: 125000 },
            average_minutes_to_triage: 12.5,
            median_minutes_to_resolution: 38,
            open_case_count: 4,
            open_case_ageing: { under_24h: 1, "1_to_3_days": 2, over_3_days: 1 },
            monitoring_alert_count: 4,
            reviewed_alert_count: 2,
            alert_review_rate_pct: 50,
          },
          exception_categories: [
            { classification: "UNMATCHED_INSTRUCTION", count: 10 },
            { classification: "UNMATCHED_SETTLEMENT", count: 5 },
            { classification: "DUPLICATE_CANDIDATE", count: 5 },
          ],
          root_cause_distribution: [{ root_cause: "SOURCE_DATA_QUALITY", resolved_cases: 1 }],
          reconciliation_run_trend: [
            {
              run_id: "run-insights-1",
              finished_at: "2026-11-07T12:00:00Z",
              payment_batch_id: "BATCH-QA-1",
              payment_count: 125,
              exact_match_rate_pct: 80,
              exception_result_count: 20,
              exception_categories: { UNMATCHED_INSTRUCTION: 10 },
            },
          ],
          recurring_exception_patterns: [],
          definitions: {
            exact_match_rate_pct: "Exact matches divided by instructions.",
            exception_review_value_by_currency_minor: "Grouped by currency, not a loss estimate.",
            average_minutes_to_triage: "Mean from case creation to first review.",
            median_minutes_to_resolution: "Median among resolved cases.",
            alert_review_rate_pct: "Reviewed alerts divided by latest run alerts.",
            open_case_ageing: "Age buckets from report generation time.",
          },
          improvement_exercise: {
            label: "Hypothetical workload exercise",
            basis: "Analyst-entered assumptions only.",
            exception_review_items: 20,
          },
        }),
      });
    } else {
      expect(url.pathname).toBe("/api/v1/insights/runs/run-insights-1/export.csv");
      await route.fulfill({
        status: 200,
        contentType: "text/csv",
        headers: {
          "content-disposition": 'attachment; filename="fireops-insights-run-insights-1.csv"',
        },
        body: "section,metric,value,unit,definition\nmetric,exact_match_rate_pct,80,percent,Exact matches divided by instructions.\n",
      });
    }
  });

  await page.goto("/#insights");
  await expect(
    page.getByRole("heading", { name: "Measure the payment day and review workload" }),
  ).toBeVisible();
  await expect(page.getByText("80.00%", { exact: true })).toBeVisible();
  await expect(page.getByText("€1,250.00", { exact: true })).toBeVisible();
  await expect(page.getByText("This calculator compares assumptions only.")).toBeVisible();
  await expect(page.getByText("SOURCE DATA QUALITY", { exact: true })).toBeVisible();
  await expect(page.getByText("80.00% exact · 20 exceptions")).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download this run’s CSV" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("fireops-insights-run-insights-1.csv");
});

test("monitoring alerts show evidence, allow human triage, and produce only a mock escalation note", async ({
  page,
}) => {
  const activities: Array<Record<string, string | null>> = [];
  let currentStatus = "OPEN";
  let disposition: string | null = null;
  const alertData = () => ({
    alert_id: "ALERT-QA-1",
    run_id: "MON-QA-1",
    rule_id: "DUPLICATE_REFERENCE",
    group_key: "REF-QA-1",
    title: "Repeated client reference",
    severity: "INFO",
    status: currentStatus,
    explanation:
      "Two fictional instructions share this client reference. Compare source records before taking action.",
    threshold: "two or more distinct instructions in one batch",
    false_positive_example: "A client may reuse a reference for legitimate split payments.",
    evidence: { client_reference: "REF-QA-1", payment_ids: ["PAY-QA-1", "PAY-QA-2"] },
    activities: activities.map((activity, index) => ({
      activity_id: `ACT-${index}`,
      activity_type: activity.type,
      occurred_at: "2026-11-07T12:00:00Z",
      actor: activity.actor,
      reason: activity.reason,
      from_status: activity.from,
      to_status: activity.to,
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
        body: JSON.stringify({ batches: [{ batch_id: "BATCH-MON-1" }], settlement_batches: [] }),
      });
    } else if (url.pathname.endsWith("/monitoring/rules")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          rules_version: "monitoring-1.0",
          rules: [
            {
              rule_id: "DUPLICATE_REFERENCE",
              title: "Repeated client reference",
              severity: "INFO",
              threshold: "two or more distinct instructions in one batch",
              purpose: "Compare repeated references.",
              false_positive_example:
                "A client may reuse a reference for legitimate split payments.",
            },
          ],
        }),
      });
    } else if (url.pathname.endsWith("/monitoring/alerts") && request.method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          alerts: activities.length ? [alertData()] : [],
          limit: 25,
          offset: 0,
        }),
      });
    } else if (
      url.pathname.endsWith("/monitoring/alerts/ALERT-QA-1") &&
      request.method() === "GET"
    ) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(alertData()),
      });
    } else if (url.pathname.endsWith("/monitoring/runs")) {
      activities.push({
        type: "DETECTED",
        actor: "system:monitoring",
        reason: null,
        from: null,
        to: "OPEN",
      });
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          run_id: "MON-QA-1",
          batch_id: "BATCH-MON-1",
          alert_count: 1,
          idempotent: false,
          alerts: [alertData()],
        }),
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
        body: JSON.stringify(alertData()),
      });
    } else if (url.pathname.endsWith("/transitions")) {
      const body = request.postDataJSON() as { target_status: string; reason?: string };
      const previous = currentStatus;
      currentStatus = body.target_status;
      disposition = body.reason ?? "Analyst started review.";
      activities.push({
        type: currentStatus === "IN_REVIEW" ? "REVIEW_STARTED" : "ESCALATED",
        actor: "demo-analyst",
        reason: disposition,
        from: previous,
        to: currentStatus,
      });
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(alertData()),
      });
    } else if (url.pathname.endsWith("/escalation-summary")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          summary_type: "SIMULATED_INTERNAL_ESCALATION_NOTE",
          rule_title: "Repeated client reference",
          severity: "INFO",
          explanation: "Review the synthetic payment references.",
          threshold: "two distinct instructions",
          evidence: { payment_ids: ["PAY-QA-1", "PAY-QA-2"] },
          analyst_reason: disposition,
          analyst: "demo-analyst",
          created_at: "2026-11-07T12:00:00Z",
          disclaimer:
            "Fictional example only. This is not a suspicious activity report, a regulatory filing, or a determination of fraud or money laundering.",
        }),
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
  await expect(
    page.getByRole("heading", { name: "Review explainable operational alerts" }),
  ).toBeVisible();
  await expect(page.getByText("Repeated client reference").first()).toBeVisible();
  await page.getByLabel("Synthetic payment batch").selectOption("BATCH-MON-1");
  await page.getByRole("button", { name: "Run monitoring rules" }).click();
  await expect(page.getByText("1 rule alert created.")).toBeVisible();
  await page
    .getByRole("button", { name: /Repeated client reference/ })
    .last()
    .click();
  await expect(
    page.getByText("A client may reuse a reference for legitimate split payments.").first(),
  ).toBeVisible();
  await expect(page.getByText("PAY-QA-1, PAY-QA-2")).toBeVisible();
  await page.getByRole("button", { name: "Start review" }).click();
  await page
    .getByLabel("Analyst note")
    .fill("Reference reuse matches the documented synthetic split-payment scenario.");
  await page.getByRole("button", { name: "Add note" }).click();
  await page.getByLabel("Review reason").fill("Escalate for a second-person operational review.");
  await page.getByRole("button", { name: "Escalate for review" }).click();
  await page.getByRole("button", { name: "View simulated escalation summary" }).click();
  const summary = page.getByRole("article", { name: "Simulated escalation summary" });
  await expect(summary.getByText("Simulated internal escalation note")).toBeVisible();
  await expect(summary.getByText(/not a suspicious activity report/i)).toBeVisible();
  const history = page.getByRole("list", { name: "Alert review history" });
  await expect(history.getByText("Detected", { exact: true })).toBeVisible();
  await expect(history.getByText("Note added", { exact: true })).toBeVisible();
  await expect(history.getByText("Escalated", { exact: true })).toBeVisible();
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

test("the read-only recruiter journey links reconciliation, investigation, monitoring, and sample insights", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByRole("link", { name: "Start sample investigation" }).click();
  await expect(
    page.getByRole("heading", { name: "Compare every payment with its settlement" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: /Take one unmatched payment/ })).toBeVisible();
  await expect(
    page.locator("#investigation").getByText("PAY-E-1231", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("No corresponding row in this sample")).toBeVisible();
  await expect(page.getByText(/unresolved from the supplied records/i)).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Review explainable operational alerts" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Measure the payment day and review workload" }),
  ).toBeVisible();
  await expect(page.getByText("97.44%", { exact: true })).toBeVisible();
  await expect(
    page.getByText("These are sample reconciliation counts, not business performance results."),
  ).toBeVisible();
});

test("mobile and tablet layouts keep the recruiter journey inside the viewport", async ({
  page,
}) => {
  await page.goto("/");

  for (const width of [320, 375, 390, 768, 1024, 1366]) {
    await page.setViewportSize({ width, height: 900 });
    const overflow = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      elements: Array.from(document.querySelectorAll("body *"))
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            tag: element.tagName,
            className: String(element.className).slice(0, 100),
            right: Math.round(rect.right),
            text: (element.textContent ?? "").trim().slice(0, 60),
          };
        })
        .filter((item) => item.right > window.innerWidth + 1)
        .slice(0, 10),
    }));
    expect(
      overflow.documentWidth,
      `horizontal overflow at ${width}px: ${JSON.stringify(overflow.elements)}`,
    ).toBeLessThanOrEqual(width);
    await expect(page.getByRole("heading", { name: /Reconcile the day/ })).toBeVisible();
  }

  await page.setViewportSize({ width: 390, height: 844 });
  const menu = page.getByText("Explore sections", { exact: true });
  await expect(menu).toBeVisible();
  await menu.click();
  await expect(
    page
      .getByRole("navigation", { name: "Main sections" })
      .getByRole("link", { name: "Investigation walkthrough" }),
  ).toBeVisible();
});

test("keyboard users can skip to the page content and reach the mobile navigation", async ({
  page,
}) => {
  await page.goto("/");
  await page.keyboard.press("Tab");

  const skipLink = page.getByRole("link", { name: "Skip to main content" });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main-content$/);
});
