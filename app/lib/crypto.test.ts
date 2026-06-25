import { describe, expect, it } from "vitest";

import { applyOrder, filterCryptos, type CoinMeta } from "~/lib/crypto";

const COINS: CoinMeta[] = [
  { symbol: "BTC", name: "Bitcoin" },
  { symbol: "ETH", name: "Ethereum" },
  { symbol: "SOL", name: "Solana" },
];

describe("filterCryptos", () => {
  it("returns all coins for an empty query", () => {
    expect(filterCryptos(COINS, "")).toHaveLength(3);
    expect(filterCryptos(COINS, "   ")).toHaveLength(3);
  });

  it("matches by name, case-insensitively", () => {
    const result = filterCryptos(COINS, "eth");
    expect(result.map((c) => c.symbol)).toEqual(["ETH"]);
  });

  it("matches by symbol", () => {
    const result = filterCryptos(COINS, "sol");
    expect(result.map((c) => c.symbol)).toEqual(["SOL"]);
  });

  it("matches partial substrings", () => {
    const result = filterCryptos(COINS, "co"); // "Bit-co-in"
    expect(result.map((c) => c.symbol)).toEqual(["BTC"]);
  });

  it("returns an empty array when nothing matches", () => {
    expect(filterCryptos(COINS, "dogecoin")).toEqual([]);
  });

  it("does not mutate the input list", () => {
    const copy = [...COINS];
    filterCryptos(COINS, "btc");
    expect(COINS).toEqual(copy);
  });
});

describe("applyOrder", () => {
  const getId = (c: CoinMeta) => c.symbol;

  it("reorders items to match the given order", () => {
    const result = applyOrder(COINS, ["SOL", "BTC", "ETH"], getId);
    expect(result.map(getId)).toEqual(["SOL", "BTC", "ETH"]);
  });

  it("appends items missing from the order in their original sequence", () => {
    const result = applyOrder(COINS, ["SOL"], getId);
    expect(result.map(getId)).toEqual(["SOL", "BTC", "ETH"]);
  });

  it("ignores ids in the order that no longer exist", () => {
    const result = applyOrder(COINS, ["DOGE", "ETH"], getId);
    expect(result.map(getId)).toEqual(["ETH", "BTC", "SOL"]);
  });

  it("ignores duplicate ids in the order", () => {
    const result = applyOrder(COINS, ["ETH", "ETH", "BTC"], getId);
    expect(result.map(getId)).toEqual(["ETH", "BTC", "SOL"]);
  });

  it("returns the original order when order is empty", () => {
    expect(applyOrder(COINS, [], getId).map(getId)).toEqual([
      "BTC",
      "ETH",
      "SOL",
    ]);
  });
});
