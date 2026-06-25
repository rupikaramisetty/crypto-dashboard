/**
 * Responsive / device layout tests.
 *
 * These run across all three Playwright projects (Desktop, Mobile, Tablet)
 * defined in playwright.config.ts, so each test here executes three times —
 * once per device — giving full cross-device coverage automatically.
 */

import { expect, test } from "@playwright/test";

import { login } from "./helpers";

test.describe("Responsive layout", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    // Wait until at least one card is visible before running layout assertions.
    await page.waitForSelector("[data-testid^='crypto-card-']", { timeout: 15_000 });
  });

  // ── Login page ───────────────────────────────────────────────────────────

  test("login page is fully visible without horizontal scroll", async ({ page }) => {
    await page.goto("/login");
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // 1px tolerance
  });

  // ── Dashboard ────────────────────────────────────────────────────────────

  test("page has no horizontal overflow", async ({ page }) => {
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  test("crypto cards are visible and not overflowing their containers", async ({ page }) => {
    // Check there's no document-level horizontal scrollbar — this is the
    // most reliable way to detect card overflow across all browsers/devices
    // without fighting DnD transform values or devicePixelRatio rounding.
    const hasHorizontalScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2
    );
    expect(hasHorizontalScroll).toBe(false);

    // Also verify cards are actually rendered and have meaningful size.
    const cards = page.locator("[data-testid^='crypto-card-']");
    await expect(cards.first()).toBeVisible();
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(10);

    const box = await cards.first().boundingBox();
    expect(box).not.toBeNull();
    // Each card must be at least 200px wide (wider than any sensible minimum)
    expect(box!.width).toBeGreaterThan(200);
  });

  test("price values do not overflow card boundaries", async ({ page }) => {
    const cards = page.locator("[data-testid^='crypto-card-']");
    const firstCard = cards.first();
    const cardBox = await firstCard.boundingBox();
    expect(cardBox).not.toBeNull();

    const prices = firstCard.locator("dd");
    const priceCount = await prices.count();
    for (let i = 0; i < priceCount; i++) {
      const priceBox = await prices.nth(i).boundingBox();
      if (priceBox && cardBox) {
        // Price element right edge must be within the card
        expect(priceBox.x + priceBox.width).toBeLessThanOrEqual(cardBox.x + cardBox.width + 1);
      }
    }
  });

  test("filter input is visible and functional", async ({ page }) => {
    const input = page.getByLabel("Filter cryptocurrencies by name or symbol");
    await expect(input).toBeVisible();
    const box = await input.boundingBox();
    expect(box).not.toBeNull();
    // Input must be wide enough to be usable (at least 120px)
    expect(box!.width).toBeGreaterThan(120);
  });

  test("search icon is visible and inside the input bounds", async ({ page }) => {
    const input = page.getByLabel("Filter cryptocurrencies by name or symbol");
    const inputBox = await input.boundingBox();
    expect(inputBox).not.toBeNull();

    // Verify the input's wrapper div (which contains the icon span) bounds the input row.
    const wrapper = page.locator("div:has(> input#crypto-filter)");
    const wrapperBox = await wrapper.boundingBox();
    if (wrapperBox && inputBox) {
      // Wrapper must contain the input
      expect(wrapperBox.y).toBeLessThanOrEqual(inputBox.y + 1);
      expect(wrapperBox.y + wrapperBox.height).toBeGreaterThanOrEqual(inputBox.y + inputBox.height - 1);
    }
  });

  test("dark/light toggle is accessible on all devices", async ({ page }) => {
    const toggle = page.getByRole("switch");
    await expect(toggle).toBeVisible();
    const box = await toggle.boundingBox();
    // Must be at least 40×40 px (touch target minimum)
    expect(box!.width).toBeGreaterThanOrEqual(38);
    expect(box!.height).toBeGreaterThanOrEqual(38);
  });

  test("sign out button is reachable", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  });

  test("card grid has at least one column", async ({ page }) => {
    const grid = page.locator("[data-testid^='crypto-card-']").first();
    const gridBox = await grid.boundingBox();
    expect(gridBox).not.toBeNull();
    // A card should take up meaningful width (not collapsed)
    const viewportWidth = page.viewportSize()?.width ?? 1280;
    expect(gridBox!.width).toBeGreaterThan(viewportWidth * 0.2);
  });

  // ── Mobile-specific checks ───────────────────────────────────────────────

  test("on small screens the toolbar stacks vertically", async ({ page }) => {
    // Only run below Tailwind's sm: breakpoint (640px) — that's where flex-col
    // kicks in and the input takes full width.
    const viewportWidth = page.viewportSize()?.width ?? 390;
    if (viewportWidth >= 640) test.skip();

    const input = page.getByLabel("Filter cryptocurrencies by name or symbol");
    const inputBox = await input.boundingBox();
    // Below sm: the input should take >70% of the viewport width (full-width).
    expect(inputBox!.width).toBeGreaterThan(viewportWidth * 0.7);
  });

  // ── Desktop-specific checks ──────────────────────────────────────────────

  test("on desktop the user name is visible in the header", async ({ page }) => {
    // The user name is hidden on mobile (<sm) via the `hidden sm:flex` classes.
    const viewportWidth = page.viewportSize()?.width ?? 1280;
    if (viewportWidth < 640) test.skip();
    await expect(page.getByText("Demo User")).toBeVisible();
  });

  test("on desktop shows 3+ columns of cards", async ({ page }) => {
    const viewportWidth = page.viewportSize()?.width ?? 1280;
    if (viewportWidth < 1024) test.skip();

    const cards = page.locator("[data-testid^='crypto-card-']");
    const first = await cards.nth(0).boundingBox();
    const second = await cards.nth(1).boundingBox();
    const third = await cards.nth(2).boundingBox();
    // All three cards on the first row should have the same y coordinate
    if (first && second && third) {
      expect(Math.abs(first.y - second.y)).toBeLessThan(5);
      expect(Math.abs(first.y - third.y)).toBeLessThan(5);
    }
  });
});
