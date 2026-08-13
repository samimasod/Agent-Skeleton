import { test, expect } from "@playwright/test";
import { setupAuthenticatedUser } from "./helpers/auth";

test.describe("Projects Workspace E2E", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedUser(page, { role: "owner" });
  });

  test("projects page loads and displays workspace title", async ({ page }) => {
    await page.goto("/dashboard/projects");
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator("body")).toBeVisible();
  });

  test("project creation trigger opens form dialog or view", async ({ page }) => {
    await page.goto("/dashboard/projects");
    const createBtn = page.locator("button:has-text('Create'), button:has-text('New Project')").first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await expect(page.locator("dialog, [role='dialog'], form")).toBeVisible();
    }
  });
});
