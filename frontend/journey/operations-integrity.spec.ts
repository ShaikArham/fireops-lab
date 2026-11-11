import { expect, test } from "@playwright/test";

test("both saved scenarios keep their own reconciliation, insights, cases and CSV evidence", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "API data integrity is browser-independent; avoid exceeding shared demo session capacity.");
  test.setTimeout(180_000);
  await page.goto("/workspace/payments/");
  const api = "/backend/api/v1";
  await expect.poll(async () => page.evaluate(() => sessionStorage.getItem("fireops-demo-access-token")), { timeout: 90_000 }).not.toBeNull();
  const token = await page.evaluate(() => sessionStorage.getItem("fireops-demo-access-token"));
  const headers = { Authorization: `Bearer ${token}` };
  await expect.poll(async () => (await page.request.get(`${api}/demo/scenarios`, { headers })).status(), { timeout: 90_000 }).toBe(200);
  const payload = await (await page.request.get(`${api}/demo/scenarios`, { headers })).json();
  const scenarios = payload.scenarios as Array<{ payment_batch_id: string; reconciliation_run_id: string }>;
  expect(scenarios).toHaveLength(2);
  expect(new Set(scenarios.map((s) => s.reconciliation_run_id)).size).toBe(2);
  for (const scenario of scenarios) {
    expect(scenario.reconciliation_run_id).toBeTruthy();
    const run = await page.request.get(`${api}/reconciliation/runs/${scenario.reconciliation_run_id}`, { headers });
    expect(run.status()).toBe(200);
    const saved = await run.json();
    expect(saved.payment_batch_id).toBe(scenario.payment_batch_id);
    const response = await page.request.get(`${api}/insights/runs/${scenario.reconciliation_run_id}`, { headers });
    expect(response.status()).toBe(200);
    const report = await response.json();
    expect(report.run_id).toBe(scenario.reconciliation_run_id);
    expect(report.payment_batch_id).toBe(scenario.payment_batch_id);
    const csv = await page.request.get(`${api}/insights/runs/${scenario.reconciliation_run_id}/export.csv`, { headers });
    expect(csv.status()).toBe(200);
    expect(csv.headers()["content-type"]).toContain("text/csv");
    const text = await csv.text();
    expect(text.length).toBeGreaterThan(50);
    expect(text).toContain(`reconciliation_run,${scenario.reconciliation_run_id},`);
    expect(text).toContain(`metric,payment_count,${report.metrics.payment_count},`);
    expect(text).toContain(`metric,exception_result_count,${report.metrics.exception_result_count},`);
    const queue = await page.request.get(`${api}/cases?run_id=${scenario.reconciliation_run_id}`, { headers });
    expect(queue.status()).toBe(200);
    const cases = (await queue.json()).cases as Array<{ case_id: string; run_id: string }>;
    if (scenario.payment_batch_id === "BATCH-E-20261015") {
      expect(cases.length).toBeGreaterThan(0);
    }
    expect(cases.every((item) => item.run_id === scenario.reconciliation_run_id)).toBe(true);
  }
});

test("assignment, notes, escalation, resolution and audit events persist", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "API case lifecycle is browser-independent; avoid exceeding shared demo session capacity.");
  test.setTimeout(180_000);
  await page.goto("/workspace/payments/");
  const api = "/backend/api/v1";
  await expect.poll(async () => page.evaluate(() => sessionStorage.getItem("fireops-demo-access-token")), { timeout: 90_000 }).not.toBeNull();
  const token = await page.evaluate(() => sessionStorage.getItem("fireops-demo-access-token"));
  const headers = { Authorization: `Bearer ${token}` };
  await expect.poll(async () => (await page.request.get(`${api}/demo/scenarios`, { headers })).status(), { timeout: 90_000 }).toBe(200);
  const scenarios = (await (await page.request.get(`${api}/demo/scenarios`, { headers })).json()).scenarios as Array<{ payment_batch_id: string; reconciliation_run_id: string }>;
  const exception = scenarios.find((s) => s.payment_batch_id === "BATCH-E-20261015");
  expect(exception).toBeDefined();
  const queue = await page.request.get(`${api}/cases?run_id=${exception!.reconciliation_run_id}`, { headers });
  expect(queue.status()).toBe(200);
  const cases = (await queue.json()).cases as Array<{ case_id: string; status: string }>;
  const target = cases.find((c) => c.status === "OPEN");
  expect(target).toBeDefined();
  const url = `${api}/cases/${target!.case_id}`;
  const post = async (suffix: string, body: object) => {
    const response = await page.request.post(url + suffix, { data: { actor: "qa.analyst", ...body }, headers: { ...headers, "x-fireops-demo": "1" } });
    expect(response.status(), await response.text()).toBe(200);
    return response.json();
  };
  const assigned = await post("/assignment", { assigned_to: "qa.analyst" });
  expect(assigned.assigned_to).toBe("qa.analyst");
  const noted = await post("/notes", { note: "Synthetic QA evidence reviewed." });
  expect(noted.activities.some((a: { reason: string }) => a.reason === "Synthetic QA evidence reviewed.")).toBe(true);
  const escalated = await post("/transitions", { target_status: "ESCALATED", reason: "Needs second-level review" });
  expect(escalated.status).toBe("ESCALATED");
  const resolved = await post("/transitions", { target_status: "RESOLVED", reason: "Evidence checked", root_cause: "UNCONFIRMED" });
  expect(resolved.status).toBe("RESOLVED");
  const saved = await (await page.request.get(url, { headers })).json();
  expect(saved.status).toBe("RESOLVED");
  expect(saved.assigned_to).toBe("qa.analyst");
  expect(saved.activities.length).toBeGreaterThanOrEqual(4);
});
