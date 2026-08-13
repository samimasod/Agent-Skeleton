import { Page } from "@playwright/test";

export interface MockUserOptions {
  uid?: string;
  email?: string;
  name?: string;
  role?: "owner" | "admin" | "member" | "viewer";
  isSuperAdmin?: boolean;
}

export async function setupAuthenticatedUser(
  page: Page,
  options: MockUserOptions = {}
) {
  const user = {
    uid: options.uid || "dev-user-123",
    email: options.email || "dev@example.com",
    name: options.name || "Dev User",
    emailVerified: true,
  };

  const org = {
    id: 1,
    name: "Acme Corp",
    slug: "acme-corp",
    role: options.role || "owner",
  };

  // Inject token and session state into localStorage before page load
  await page.addInitScript(
    ({ mockUser, mockOrg, isSuperAdmin }) => {
      window.localStorage.setItem("auth_token", "dev-user-123");
      window.localStorage.setItem("user_profile", JSON.stringify(mockUser));
      window.localStorage.setItem("current_org", JSON.stringify(mockOrg));
      if (isSuperAdmin) {
        window.localStorage.setItem("is_super_admin", "true");
      }
    },
    {
      mockUser: user,
      mockOrg: org,
      isSuperAdmin: options.isSuperAdmin || false,
    }
  );
}
