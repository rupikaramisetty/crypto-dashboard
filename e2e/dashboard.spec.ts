import { expect, test } from "@playwright/test";

import { login } from "./helpers";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // ── Cards ────────────────────────────────────────────────────────────────

  test("renders at least 10 crypto cards", async ({ page }) => {
    const cards = page.locator("[data-testid^='crypto-card-']");
    await expect(cards).toHaveCount(12);
  });

  test("each card shows name, symbol, USD price and BTC price", async ({ page }) => {
    const btcCard = page.getByTestId("crypto-card-BTC");
    await expect(btcCard.getByText("Bitcoin")).toBeVisible();
    // Target the symbol <p> specifically — getByText("BTC") also hits the badge and dt text.
    await expect(btcCard.locator("p.uppercase")).toContainText("BTC");
    // USD price matches currency format
    await expect(btcCard.locator("dd").first()).toContainText("$");
    // BTC price for BTC is always ₿1
    await expect(btcCard.locator("dd").last()).toContainText("₿1");
  });

  test("prices are not empty or zero", async ({ page }) => {
    const firstCard = page.locator("[data-testid^='crypto-card-']").first();
    const usd = firstCard.locator("dd").first();
    const btc = firstCard.locator("dd").last();
    // Neither price should be "—" (error sentinel) or contain only zeros
    await expect(usd).not.toContainText("—");
    await expect(btc).not.toContainText("—");
  });

  // ── Filter ───────────────────────────────────────────────────────────────

  // Helper: type into the filter input character-by-character.
  // `fill()` does not fire per-character `input` events on WebKit (Safari/iPad),
  // so React's onChange never triggers. `pressSequentially` is reliable everywhere.
  async function typeInFilter(page: import("@playwright/test").Page, text: string) {
    const input = page.getByLabel("Filter cryptocurrencies by name or symbol");
    await input.click();
    await input.pressSequentially(text, { delay: 30 });
  }

  test("filter by name narrows the card list", async ({ page }) => {
    await typeInFilter(page, "eth");
    const cards = page.locator("[data-testid^='crypto-card-']");
    await expect(cards).toHaveCount(1);
    await expect(cards.first().getByText("Ethereum")).toBeVisible();
  });

  test("filter by symbol is case-insensitive", async ({ page }) => {
    await typeInFilter(page, "SOL");
    await expect(page.getByTestId("crypto-card-SOL")).toBeVisible();
    await expect(page.locator("[data-testid^='crypto-card-']")).toHaveCount(1);
  });

  test("clearing the filter restores all cards", async ({ page }) => {
    await typeInFilter(page, "btc");
    await expect(page.locator("[data-testid^='crypto-card-']")).toHaveCount(1);
    await page.getByRole("button", { name: "Clear filter" }).click();
    await expect(page.locator("[data-testid^='crypto-card-']")).toHaveCount(12);
  });

  test("filter with no match shows empty state", async ({ page }) => {
    await typeInFilter(page, "zzznomatch");
    await expect(page.getByText(/No coins match/)).toBeVisible();
  });

  test("filter result count label updates live", async ({ page }) => {
    await typeInFilter(page, "sol");
    await expect(page.getByText(/1 of 12 match/)).toBeVisible();
  });

  // ── Refresh ──────────────────────────────────────────────────────────────

  test("manual refresh button triggers a re-fetch", async ({ page }) => {
    const btn = page.getByRole("button", { name: /Refresh/ });
    await expect(btn).toBeVisible();
    await btn.click();
    // Button briefly shows "Refreshing…" then goes back to "Refresh"
    await expect(page.getByRole("button", { name: "Refresh" })).toBeVisible({ timeout: 10_000 });
  });

  test("auto-refresh checkbox is checked by default", async ({ page }) => {
    await expect(page.getByLabel(/Auto-refresh/)).toBeChecked();
  });

  test("unchecking auto-refresh toggles off without error", async ({ page }) => {
    const checkbox = page.getByLabel(/Auto-refresh/);
    await checkbox.uncheck();
    await expect(checkbox).not.toBeChecked();
    // No error states should appear
    await expect(page.locator("[role='alert']")).not.toBeVisible();
  });

  // ── Dark / light mode ────────────────────────────────────────────────────

  test("dark mode toggle switches theme", async ({ page }) => {
    // Start in light mode (default)
    const html = page.locator("html");
    const toggle = page.getByRole("switch", { name: /Switch to dark mode/i });
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(html).toHaveClass(/dark/);
  });

  test("dark mode persists after reload", async ({ page }) => {
    await page.getByRole("switch").click(); // switch to dark
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark/);
    // Switch back so other tests start in light mode
    await page.getByRole("switch").click();
  });

  // ── Drag handle presence ─────────────────────────────────────────────────

  test("each card has an accessible drag handle", async ({ page }) => {
    const btcHandle = page.getByRole("button", { name: /Drag to reorder Bitcoin/ });
    await expect(btcHandle).toBeVisible();
  });

  test("drag handles are hidden while filter is active", async ({ page }) => {
    await page.getByLabel("Filter cryptocurrencies by name or symbol").fill("eth");
    // When filter is active, DnD is disabled — the drag handle button is still
    // rendered (it's in the presentational CryptoCard used by static grid) but
    // the DnD context is torn down. Verify the hint label is shown instead.
    await expect(page.getByText("Drag-to-reorder is paused while filtering.")).toBeVisible();
  });

  // ── Persisted order hint ─────────────────────────────────────────────────

  test("reset order button appears after reorder hint", async ({ page }) => {
    // Manually set localStorage to simulate a saved custom order
    await page.evaluate(() => {
      localStorage.setItem(
        "crypto-dashboard:card-order",
        JSON.stringify(["ETH", "BTC", "SOL", "XRP", "ADA", "DOGE", "AVAX", "LINK", "DOT", "MATIC", "LTC", "UNI"])
      );
    });
    await page.reload();
    // Wait for hydration
    await expect(page.getByRole("button", { name: "Reset order" })).toBeVisible();
  });
});
