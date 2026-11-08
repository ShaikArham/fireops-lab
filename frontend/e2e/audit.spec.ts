import { expect, test } from "@playwright/test";

test("case drafts cannot leak into another investigation", async ({ page }) => {
  const record = (id: string) => ({
    case_id: id,
    result_id: id,
    run_id: "run",
    classification: "UNMATCHED_INSTRUCTION",
    status: "IN_REVIEW",
    priority: "NORMAL",
    assigned_to: null,
    root_cause: null,
    activities: [],
    payment: null,
    settlement: null,
  });
  await page.route("https://api.fireops.test/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const body = path.endsWith("/cases")
      ? { cases: [record("CASE-A"), record("CASE-B")] }
      : path.includes("/cases/CASE-")
        ? record(path.split("/").at(-1) ?? "")
        : path.endsWith("/batches")
          ? { batches: [], settlement_batches: [] }
          : path.endsWith("/monitoring/rules")
            ? { rules: [] }
            : path.endsWith("/monitoring/alerts")
              ? { alerts: [] }
              : { detail: "No saved reports yet" };
    await route.fulfill({ status: path.endsWith("/insights/latest") ? 404 : 200, json: body });
  });
  await page.goto("/");
  const queue = page.getByRole("list", { name: "Exception case queue" });
  await queue.getByRole("button").nth(0).click();
  await page.getByLabel("Investigation note", { exact: true }).fill("Evidence for A only");
  await page.getByLabel("Action reason", { exact: true }).fill("Reason for A only");
  await page.getByLabel("Assign to analyst", { exact: true }).fill("analyst.a");
  await queue.getByRole("button").nth(1).click();
  await expect(page.getByLabel("Investigation note", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("Action reason", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("Assign to analyst", { exact: true })).toHaveValue("");
});

test("alert review drafts reset on selection and queue pages remain reachable", async ({
  page,
}) => {
  const record = (id: string) => ({
    alert_id: id,
    run_id: "run",
    rule_id: "HIGH_VALUE_PAYMENT",
    group_key: id,
    title: id,
    severity: "REVIEW",
    status: "IN_REVIEW",
    explanation: "Synthetic threshold",
    threshold: "1900000",
    false_positive_example: "Expected payroll",
    evidence: {},
    activities: [],
  });
  await page.route("https://api.fireops.test/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const body = path.endsWith("/monitoring/alerts")
      ? {
          alerts:
            url.searchParams.get("offset") === "25"
              ? [record("ALERT-LAST")]
              : Array.from({ length: 25 }, (_, i) => record(`ALERT-${i}`)),
        }
      : path.includes("/monitoring/alerts/ALERT-")
        ? record(path.split("/").at(-1) ?? "")
        : path.endsWith("/batches")
          ? { batches: [], settlement_batches: [] }
          : path.endsWith("/cases")
            ? { cases: [] }
            : path.endsWith("/monitoring/rules")
              ? { rules: [] }
              : { detail: "No saved reports yet" };
    await route.fulfill({ status: path.endsWith("/insights/latest") ? 404 : 200, json: body });
  });
  await page.goto("/");
  const panel = page.locator("#monitoring");
  const queue = panel.getByRole("list", { name: "Monitoring alert queue" });
  await queue.getByRole("button").nth(0).click();
  await panel.getByLabel("Analyst note", { exact: true }).fill("Only alert zero");
  await panel.getByLabel("Review reason", { exact: true }).fill("Only alert zero reason");
  await queue.getByRole("button").nth(1).click();
  await expect(panel.getByLabel("Analyst note", { exact: true })).toHaveValue("");
  await expect(panel.getByLabel("Review reason", { exact: true })).toHaveValue("");
  await panel.getByRole("button", { name: "Next alerts" }).click();
  await expect(queue.getByRole("button", { name: /ALERT-LAST/ })).toBeVisible();
  await panel.getByRole("button", { name: "Previous alerts" }).click();
  await expect(queue.getByRole("button")).toHaveCount(25);
});
