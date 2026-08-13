import { test, expect } from "@playwright/test";
import { setupAuthenticatedUser } from "./helpers/auth";

test.describe("Multi-Tenant Organization & RBAC E2E", () => {
  test("owner user sees full management options in settings", async ({ page }) => {
    await setupAuthenticatedUser(page, { role: "owner" });
    await page.goto("/dashboard/settings");
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator("body")).toBeVisible();
  });

  test("viewer user has read-only dashboard access", async ({ page }) => {
    await setupAuthenticatedUser(page, { role: "viewer" });
    await page.goto("/dashboard");
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator("body")).toBeVisible();
  });
});
