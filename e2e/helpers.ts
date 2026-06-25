import type { Page } from "@playwright/test";

export const DEMO_EMAIL = "demo@example.com";
export const DEMO_PASSWORD = "password";
export const DEMO_NAME = "Demo User";

/** Log in with the demo credentials and land on the dashboard. */
export async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(DEMO_EMAIL);
  await page.getByLabel("Password").fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("/");
}
