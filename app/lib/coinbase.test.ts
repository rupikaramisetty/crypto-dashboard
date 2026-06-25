import { afterEach, describe, expect, it, vi } from "vitest";

import {
  CoinbaseError,
  fetchCryptoRates,
  mapRates,
} from "~/lib/coinbase.server";

// A trimmed Coinbase-style rate map: "units of X per 1 USD".
const RAW = {
  BTC: "0.000015625", // => $64,000 / BTC
  ETH: "0.0003125", //   => $3,200  / ETH
  SOL: "0.006666667", // => ~$150   / SOL
  // DOGE intentionally omitted to test graceful skipping.
};

describe("mapRates", () => {
  const btcPerUsd = Number(RAW.BTC);
  const result = mapRates(RAW, btcPerUsd);

  it("derives USD prices by inverting the rate", () => {
    const btc = result.find((r) => r.symbol === "BTC");
    expect(btc?.usd).toBeCloseTo(64000, 0);

    const eth = result.find((r) => r.symbol === "ETH");
    expect(eth?.usd).toBeCloseTo(3200, 0);
  });

  it("derives BTC prices and pins BTC to 1", () => {
    const btc = result.find((r) => r.symbol === "BTC");
    expect(btc?.btc).toBeCloseTo(1, 8);

    const eth = result.find((r) => r.symbol === "ETH");
    expect(eth?.btc).toBeCloseTo(0.05, 6); // 3200 / 64000
  });

  it("skips coins missing from the response rather than failing", () => {
    expect(result.some((r) => r.symbol === "DOGE")).toBe(false);
  });

  it("ignores non-numeric or non-positive rates", () => {
    const withGarbage = mapRates(
      { BTC: RAW.BTC, ETH: "not-a-number", SOL: "0" },
      btcPerUsd
    );
    expect(withGarbage.map((r) => r.symbol)).toEqual(["BTC"]);
  });
});

describe("fetchCryptoRates", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubFetch(impl: () => Promise<Response>) {
    vi.stubGlobal("fetch", vi.fn(impl));
  }

  it("returns a payload of rates on success", async () => {
    stubFetch(async () =>
      new Response(JSON.stringify({ data: { currency: "USD", rates: RAW } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const payload = await fetchCryptoRates();
    expect(payload.rates.length).toBeGreaterThan(0);
    expect(payload.rates.some((r) => r.symbol === "BTC")).toBe(true);
    expect(typeof payload.fetchedAt).toBe("number");
  });

  it("throws a CoinbaseError on a non-OK HTTP status", async () => {
    stubFetch(async () => new Response("nope", { status: 503 }));
    await expect(fetchCryptoRates()).rejects.toBeInstanceOf(CoinbaseError);
  });

  it("throws a CoinbaseError on invalid JSON", async () => {
    stubFetch(
      async () =>
        new Response("not json", {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
    );
    await expect(fetchCryptoRates()).rejects.toBeInstanceOf(CoinbaseError);
  });

  it("throws a CoinbaseError when the BTC rate is missing", async () => {
    stubFetch(
      async () =>
        new Response(
          JSON.stringify({ data: { currency: "USD", rates: { ETH: "0.0003" } } }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
    );
    await expect(fetchCryptoRates()).rejects.toThrow(/BTC/);
  });

  it("throws a CoinbaseError when the network request fails", async () => {
    stubFetch(async () => {
      throw new TypeError("network down");
    });
    await expect(fetchCryptoRates()).rejects.toBeInstanceOf(CoinbaseError);
  });
});
