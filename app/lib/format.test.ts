import { describe, expect, it } from "vitest";

import { formatBtc, formatRelativeTime, formatUsd } from "~/lib/format";

describe("formatUsd", () => {
  it("uses 2 decimals for values >= 1", () => {
    expect(formatUsd(64000)).toBe("$64,000.00");
    expect(formatUsd(1.5)).toBe("$1.50");
  });

  it("uses more precision for small values", () => {
    expect(formatUsd(0.1234)).toBe("$0.1234");
    expect(formatUsd(0.00012345)).toBe("$0.000123");
  });

  it("renders an em dash for non-finite input", () => {
    expect(formatUsd(Number.NaN)).toBe("—");
    expect(formatUsd(Number.POSITIVE_INFINITY)).toBe("—");
  });
});

describe("formatBtc", () => {
  it("returns ₿1 for Bitcoin itself", () => {
    expect(formatBtc(1)).toBe("₿1");
  });

  it("trims trailing zeros", () => {
    expect(formatBtc(0.05)).toBe("₿0.05");
  });

  it("shows up to 8 decimals (satoshi precision) for tiny values", () => {
    expect(formatBtc(0.00001234)).toBe("₿0.00001234");
  });

  it("handles zero and non-finite values", () => {
    expect(formatBtc(0)).toBe("₿0");
    expect(formatBtc(Number.NaN)).toBe("—");
  });
});

describe("formatRelativeTime", () => {
  const now = 1_000_000_000_000;

  it("says 'just now' for very recent times", () => {
    expect(formatRelativeTime(now - 2000, now)).toBe("just now");
  });

  it("reports seconds", () => {
    expect(formatRelativeTime(now - 30_000, now)).toBe("30s ago");
  });

  it("reports minutes", () => {
    expect(formatRelativeTime(now - 5 * 60_000, now)).toBe("5m ago");
  });

  it("never returns a negative duration", () => {
    expect(formatRelativeTime(now + 5000, now)).toBe("just now");
  });
});
