import { test as base } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";

type AuthFixtures = {
  loginAsQm: () => Promise<void>;
  loginAsLeadership: () => Promise<void>;
};

export const test = base.extend<AuthFixtures>({
  loginAsQm: async ({ page }, use) => {
    const login = async () => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login("qm@example.com", "password123");
      await page.waitForURL(/\/(qm|leadership)/);
    };
    await use(login);
  },
  loginAsLeadership: async ({ page }, use) => {
    const login = async () => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login("lead@example.com", "password123");
      await page.waitForURL("**/leadership**");
    };
    await use(login);
  },
});

export { expect } from "@playwright/test";
