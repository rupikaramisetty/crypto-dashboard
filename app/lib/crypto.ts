/**
 * Domain types and the curated set of cryptocurrencies the dashboard displays.
 *
 * Coinbase's `exchange-rates` endpoint returns rates keyed by symbol but no
 * human-readable names, so we keep a small static map of the coins we care
 * about. Add an entry here to surface a new coin on the dashboard — see the
 * "Adding a new cryptocurrency" section of the README.
 */

export interface CoinMeta {
  /** Ticker symbol, e.g. "BTC". Must match a key in the Coinbase rates map. */
  symbol: string;
  /** Display name, e.g. "Bitcoin". */
  name: string;
}

export interface CryptoRate extends CoinMeta {
  /** Price of one unit in USD. */
  usd: number;
  /** Price of one unit denominated in BTC. `1` for BTC itself. */
  btc: number;
}

/**
 * The coins shown on the dashboard, in their default display order.
 * At least 10 per the requirements; the symbols must exist in the Coinbase
 * exchange-rates response.
 */
export const TRACKED_COINS: readonly CoinMeta[] = [
  { symbol: "BTC", name: "Bitcoin" },
  { symbol: "ETH", name: "Ethereum" },
  { symbol: "SOL", name: "Solana" },
  { symbol: "XRP", name: "XRP" },
  { symbol: "ADA", name: "Cardano" },
  { symbol: "DOGE", name: "Dogecoin" },
  { symbol: "AVAX", name: "Avalanche" },
  { symbol: "LINK", name: "Chainlink" },
  { symbol: "DOT", name: "Polkadot" },
  { symbol: "MATIC", name: "Polygon" },
  { symbol: "LTC", name: "Litecoin" },
  { symbol: "UNI", name: "Uniswap" },
] as const;

/**
 * Filter a list of rates by a free-text query, matching against either the
 * coin name or its symbol (case-insensitive). An empty query returns the list
 * unchanged.
 */
export function filterCryptos<T extends CoinMeta>(
  coins: readonly T[],
  query: string
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...coins];
  return coins.filter(
    (coin) =>
      coin.name.toLowerCase().includes(q) ||
      coin.symbol.toLowerCase().includes(q)
  );
}

/**
 * Reorder `items` so that they follow the sequence of ids in `order`. Ids in
 * `order` that are missing from `items` are skipped; items not mentioned in
 * `order` are appended in their original order. This keeps a persisted order
 * stable even when the tracked-coin list changes between sessions.
 */
export function applyOrder<T>(
  items: readonly T[],
  order: readonly string[],
  getId: (item: T) => string
): T[] {
  const byId = new Map(items.map((item) => [getId(item), item]));
  const result: T[] = [];
  const seen = new Set<string>();

  for (const id of order) {
    const item = byId.get(id);
    if (item && !seen.has(id)) {
      result.push(item);
      seen.add(id);
    }
  }
  for (const item of items) {
    const id = getId(item);
    if (!seen.has(id)) {
      result.push(item);
      seen.add(id);
    }
  }
  return result;
}
