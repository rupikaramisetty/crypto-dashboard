/**
 * Server-only Coinbase integration. The `.server.ts` suffix guarantees this
 * module (and any API specifics) never ships to the browser bundle.
 *
 * We use the public, key-less endpoint:
 *   GET https://api.coinbase.com/v2/exchange-rates?currency=USD
 *
 * It returns `data.rates`, a map of `symbol -> "units of that currency per 1
 * USD"` (as strings). From that single response we can derive every figure the
 * dashboard needs:
 *   - USD price of coin X  = 1 / rates[X]
 *   - BTC price of coin X  = rates[BTC] / rates[X]
 */

import { TRACKED_COINS, type CryptoRate } from "~/lib/crypto";

const COINBASE_RATES_URL =
  "https://api.coinbase.com/v2/exchange-rates?currency=USD";

const REQUEST_TIMEOUT_MS = 8_000;

interface CoinbaseRatesResponse {
  data: {
    currency: string;
    rates: Record<string, string>;
  };
}

export interface RatesPayload {
  rates: CryptoRate[];
  /** Epoch ms at which the data was fetched (server clock). */
  fetchedAt: number;
}

/** Thrown for any failure while talking to Coinbase, with a user-safe message. */
export class CoinbaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CoinbaseError";
  }
}

function parseRate(raw: string | undefined): number | null {
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Fetch live exchange rates and map them onto our tracked coin list. Coins
 * missing from the response are skipped rather than failing the whole request.
 */
export async function fetchCryptoRates(
  signal?: AbortSignal
): Promise<RatesPayload> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  // Abort our request if the incoming request is cancelled.
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", () => controller.abort(), {
      once: true,
    });
  }

  let response: Response;
  try {
    response = await fetch(COINBASE_RATES_URL, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new CoinbaseError("The request to Coinbase timed out.");
    }
    throw new CoinbaseError("Could not reach the Coinbase API.");
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new CoinbaseError(
      `Coinbase API returned an error (HTTP ${response.status}).`
    );
  }

  let body: CoinbaseRatesResponse;
  try {
    body = (await response.json()) as CoinbaseRatesResponse;
  } catch {
    throw new CoinbaseError("Received an invalid response from Coinbase.");
  }

  const rawRates = body?.data?.rates;
  if (!rawRates || typeof rawRates !== "object") {
    throw new CoinbaseError("Coinbase response was missing rate data.");
  }

  const btcPerUsd = parseRate(rawRates.BTC);
  if (btcPerUsd == null) {
    throw new CoinbaseError("Coinbase response did not include a BTC rate.");
  }

  const rates = mapRates(rawRates, btcPerUsd);
  if (rates.length === 0) {
    throw new CoinbaseError("None of the tracked coins were found in the response.");
  }

  return { rates, fetchedAt: Date.now() };
}

/** Pure transform from the raw Coinbase rate map to our `CryptoRate[]`. Exported for testing. */
export function mapRates(
  rawRates: Record<string, string>,
  btcPerUsd: number
): CryptoRate[] {
  const rates: CryptoRate[] = [];

  for (const coin of TRACKED_COINS) {
    const coinPerUsd = parseRate(rawRates[coin.symbol]);
    if (coinPerUsd == null) continue;

    rates.push({
      ...coin,
      usd: 1 / coinPerUsd,
      // (BTC per USD) / (coin per USD) = BTC per coin.
      btc: btcPerUsd / coinPerUsd,
    });
  }

  return rates;
}
