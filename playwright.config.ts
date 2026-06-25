import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E configuration.
 *
 * Projects cover three common form-factors:
 *   - Desktop  (1280 × 720, Chromium)
 *   - Mobile   (iPhone 12, 390 × 844, WebKit)
 *   - Tablet   (iPad Pro 11", 834 × 1194, Chromium)
 *
 * The `webServer` block starts `pnpm dev` automatically when tests run, so no
 * manually-started server is required.
 */
export default defineConfig({
  testDir: "./e2e",
  /* Run tests in files in parallel. */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source. */
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],

  use: {
    baseURL: "http://localhost:3000",
    /* Collect traces on first retry to help diagnose failures. */
    trace: "on-first-retry",
    /* Capture screenshots on failure. */
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "Desktop Chrome",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "Mobile Safari (iPhone 12)",
      use: { ...devices["iPhone 12"] },
    },
    {
      name: "Tablet (iPad Pro)",
      use: {
        ...devices["iPad Pro 11"],
        viewport: { width: 834, height: 1194 },
      },
    },
  ],

  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
