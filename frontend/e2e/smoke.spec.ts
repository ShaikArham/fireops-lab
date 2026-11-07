import { expect, test } from "@playwright/test";

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
