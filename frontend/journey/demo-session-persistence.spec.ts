import { expect, test } from "@playwright/test";

test("new and returning visitors retain isolated demo sessions without duplicate runs", async ({ browser, browserName }) => {
  // Two new sessions per test can exceed the demo's five-sessions-per-minute
  // protection when the three browser projects share a CI database.
  test.skip(browserName !== "chromium", "Isolation is verified in Chromium; navigation runs in all browsers.");
  test.setTimeout(180_000);
  const first = await browser.newContext();
  const second = await browser.newContext();
  try {
    const page = await first.newPage();
    await page.goto("/workspace/payments/");
    await expect.poll(async () => page.evaluate(() => sessionStorage.getItem("fireops-demo-access-token")), { timeout: 90_000 }).not.toBeNull();
    const token = await page.evaluate(() => sessionStorage.getItem("fireops-demo-access-token"));
    const headers = { Authorization: `Bearer ${token}` };
    await expect.poll(async () => (await page.request.get("/backend/api/v1/batches", { headers })).status(), { timeout: 90_000 }).toBe(200);
    const initial = await (await page.request.get("/backend/api/v1/batches", { headers })).json();
    expect(initial.batches.map((item: { batch_id: string }) => item.batch_id)).toEqual(
      expect.arrayContaining(["BATCH-N-20261014", "BATCH-E-20261015"]),
    );
    expect(token).toBeTruthy();
    const saved = await (await page.request.get("/backend/api/v1/demo/scenarios", { headers })).json();
    expect(saved.scenarios).toHaveLength(2);
    expect(saved.scenarios.every((item: { reconciliation_run_id: string | null }) => Boolean(item.reconciliation_run_id))).toBe(true);

    await page.reload();
    await expect.poll(async () => (await page.request.get("/backend/api/v1/batches", { headers })).status()).toBe(200);
    const reloaded = await (await page.request.get("/backend/api/v1/batches", { headers })).json();
    expect(reloaded.batches.map((item: { batch_id: string }) => item.batch_id).sort()).toEqual(
      initial.batches.map((item: { batch_id: string }) => item.batch_id).sort(),
    );
    expect(await (await page.request.get("/backend/api/v1/demo/scenarios", { headers })).json()).toEqual(saved);

    const returning = await first.newPage();
    await returning.goto("/workspace/overview/");
    expect(await (await returning.request.get("/backend/api/v1/demo/scenarios", { headers })).json()).toEqual(saved);

    const visitor = await second.newPage();
    expect((await visitor.request.get("/backend/api/v1/batches")).status()).toBe(401);
    await visitor.goto("/workspace/payments/");
    await expect.poll(async () => visitor.evaluate(() => sessionStorage.getItem("fireops-demo-access-token")), { timeout: 90_000 }).not.toBeNull();
    const otherToken = await visitor.evaluate(() => sessionStorage.getItem("fireops-demo-access-token"));
    expect(otherToken).toBeTruthy();
    expect(otherToken).not.toBe(token);
    await expect.poll(async () => (await visitor.request.get("/backend/api/v1/batches", { headers: { Authorization: `Bearer ${otherToken}` } })).status(), { timeout: 90_000 }).toBe(200);
  } finally {
    await first.close();
    await second.close();
  }
});
