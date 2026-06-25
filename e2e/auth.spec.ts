import { expect, test } from "@playwright/test";

import { DEMO_EMAIL, DEMO_NAME, DEMO_PASSWORD, login } from "./helpers";

test.describe("Authentication", () => {
  test("unauthenticated visit to / redirects to /login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("login page shows demo credentials hint", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("Demo credentials")).toBeVisible();
    await expect(page.getByText(`${DEMO_EMAIL} / ${DEMO_PASSWORD}`)).toBeVisible();
  });

  test("shows validation errors for empty submission", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Email is required.")).toBeVisible();
    await expect(page.getByText("Password is required.")).toBeVisible();
  });

  test("shows error for invalid email format", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email address").fill("notanemail");
    await page.getByLabel("Password").fill("password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Enter a valid email address.")).toBeVisible();
  });

  test("shows error for wrong credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email address").fill(DEMO_EMAIL);
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Invalid email or password.")).toBeVisible();
  });

  test("successful login redirects to dashboard and shows user name", async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL("/");
    await expect(page.getByText(DEMO_NAME)).toBeVisible();
  });

  test("already logged in — /login redirects to dashboard", async ({ page }) => {
    await login(page);
    await page.goto("/login");
    await expect(page).toHaveURL("/");
  });

  test("sign out clears session and redirects to login", async ({ page }) => {
    await login(page);
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login/);
    // Revisiting the dashboard should redirect back to login.
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });
});
