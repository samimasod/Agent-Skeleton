import { test, expect } from "@playwright/test";
import { setupAuthenticatedUser } from "./helpers/auth";

test.describe("Frontend Smoke & Navigation E2E", () => {
  test("login page renders correctly when unauthenticated", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle(/Skeleton|Sign In|Login/i);
    await expect(page.locator("form")).toBeVisible();
  });

  test("unauthenticated user accessing /dashboard redirects to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("authenticated user can access dashboard layout", async ({ page }) => {
    await setupAuthenticatedUser(page, { role: "owner" });
    await page.goto("/dashboard");
    await expect(page).not.toHaveURL(/\/login/);
  });
});
