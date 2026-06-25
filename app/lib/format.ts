/**
 * Presentation helpers for prices. Kept pure and framework-free so they can be
 * unit-tested in isolation and reused on both server and client.
 */

/**
 * Format a USD price. Cheaper coins need more decimal places to stay
 * meaningful, so we scale precision with magnitude.
 */
export function formatUsd(value: number): string {
  if (!Number.isFinite(value)) return "—";

  const fractionDigits = value >= 1 ? 2 : value >= 0.01 ? 4 : 6;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

/**
 * Format a price denominated in BTC. We show a generous number of significant
 * digits because most coins are worth a tiny fraction of a Bitcoin, then trim
 * trailing zeros for readability. Uses the ₿ symbol as a prefix.
 */
export function formatBtc(value: number): string {
  if (!Number.isFinite(value)) return "—";
  if (value === 0) return "₿0";

  // 8 decimals == 1 satoshi, the smallest BTC unit.
  const fixed = value >= 1 ? value.toFixed(4) : value.toFixed(8);
  const trimmed = fixed.replace(/\.?0+$/, "");
  return `₿${trimmed}`;
}

/**
 * Human-friendly "x seconds/minutes ago" relative time. Falls back to a clock
 * time for anything older than an hour.
 */
export function formatRelativeTime(from: number, now: number): string {
  const seconds = Math.max(0, Math.round((now - from) / 1000));

  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  return new Date(from).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
