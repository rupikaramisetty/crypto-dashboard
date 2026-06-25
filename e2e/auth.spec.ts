import { expect, test } from "@playwright/test";

import { DEMO_EMAIL, DEMO_NAME, login } from "./helpers";

/** Generate an email that won't collide across parallel device projects. */
function uniqueEmail(prefix = "user") {
  return `${prefix}_${Date.now()}@example.com`;
}

test.describe("Authentication", () => {
  test("unauthenticated visit to / redirects to /login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("login page shows demo credentials hint", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("Demo credentials")).toBeVisible();
    // The hint uses non-breaking spaces around the slash — match by substring.
    await expect(page.getByText(DEMO_EMAIL, { exact: false })).toBeVisible();
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
    await page.getByLabel("Password", { exact: true }).fill("password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Enter a valid email address.")).toBeVisible();
  });

  test("shows error for wrong credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email address").fill(DEMO_EMAIL);
    await page.getByLabel("Password", { exact: true }).fill("wrongpassword");
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

  test("login page has a link to the sign-up page", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "Create one" }).click();
    await expect(page).toHaveURL("/signup");
  });
});

test.describe("Sign up", () => {
  test("renders the signup form with all required fields", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByLabel("Full name")).toBeVisible();
    await expect(page.getByLabel("Email address")).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Confirm password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Create account" })).toBeVisible();
  });

  test("has a link back to the sign-in page", async ({ page }) => {
    await page.goto("/signup");
    await page.getByRole("link", { name: "Sign in" }).click();
    await expect(page).toHaveURL("/login");
  });

  test("already signed in — /signup redirects to dashboard", async ({ page }) => {
    await login(page);
    await page.goto("/signup");
    await expect(page).toHaveURL("/");
  });

  test("shows validation errors when form is submitted empty", async ({ page }) => {
    await page.goto("/signup");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Name is required.")).toBeVisible();
    await expect(page.getByText("Email is required.")).toBeVisible();
    await expect(page.getByText("Password is required.")).toBeVisible();
    await expect(page.getByText("Please confirm your password.")).toBeVisible();
  });

  test("shows error for short name", async ({ page }) => {
    await page.goto("/signup");
    await page.getByLabel("Full name").fill("A");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Name must be at least 2 characters.")).toBeVisible();
  });

  test("shows error for invalid email", async ({ page }) => {
    await page.goto("/signup");
    await page.getByLabel("Full name").fill("Test User");
    await page.getByLabel("Email address").fill("bademail");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Enter a valid email address.")).toBeVisible();
  });

  test("shows error for short password", async ({ page }) => {
    await page.goto("/signup");
    await page.getByLabel("Full name").fill("Test User");
    await page.getByLabel("Email address").fill("test@example.com");
    await page.getByLabel("Password", { exact: true }).fill("short");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Password must be at least 8 characters.")).toBeVisible();
  });

  test("shows error when passwords don't match", async ({ page }) => {
    await page.goto("/signup");
    await page.getByLabel("Full name").fill("Test User");
    await page.getByLabel("Email address").fill("test@example.com");
    await page.getByLabel("Password", { exact: true }).fill("password123");
    await page.getByLabel("Confirm password").fill("different123");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Passwords don't match.")).toBeVisible();
  });

  test("successful signup logs user in and redirects to dashboard", async ({ page }) => {
    const email = uniqueEmail("new");
    await page.goto("/signup");
    await page.getByLabel("Full name").fill("New User");
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password", { exact: true }).fill("securepass");
    await page.getByLabel("Confirm password").fill("securepass");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByText("New User")).toBeVisible();
  });

  test("signing up with a duplicate email shows an error", async ({ page }) => {
    const email = uniqueEmail("dup");

    // First signup succeeds.
    await page.goto("/signup");
    await page.getByLabel("Full name").fill("First User");
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password", { exact: true }).fill("securepass");
    await page.getByLabel("Confirm password").fill("securepass");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL("/");

    // Sign out and wait for the redirect to finish before navigating again.
    await page.getByRole("button", { name: "Sign out" }).click();
    await page.waitForURL(/\/login/);
    await page.goto("/signup");
    await page.getByLabel("Full name").fill("Second User");
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password", { exact: true }).fill("differentpass");
    await page.getByLabel("Confirm password").fill("differentpass");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText(/already exists/)).toBeVisible();
  });
});
