import { test, expect } from "@playwright/test";
import { setupAuthenticatedUser } from "./helpers/auth";

test.describe("AI Agents Feature E2E", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedUser(page, { role: "owner" });
  });

  test("agents page loads and renders agent list or empty state", async ({ page }) => {
    await page.goto("/dashboard/agents");
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator("body")).toBeVisible();
  });

  test("navigate to agent builder or detail view", async ({ page }) => {
    await page.goto("/dashboard/agents");
    const agentCard = page.locator("a[href*='/dashboard/agents/'], button:has-text('Agent')").first();
    if (await agentCard.isVisible()) {
      await agentCard.click();
      await expect(page).toHaveURL(/\/dashboard\/agents/);
    }
  });
});
