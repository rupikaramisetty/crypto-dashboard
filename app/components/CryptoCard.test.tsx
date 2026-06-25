import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CryptoCard } from "~/components/CryptoCard";
import type { CryptoRate } from "~/lib/crypto";

const RATE: CryptoRate = {
  symbol: "ETH",
  name: "Ethereum",
  usd: 3200,
  btc: 0.05,
};

describe("CryptoCard", () => {
  it("shows the coin name and symbol", () => {
    render(<CryptoCard rate={RATE} />);
    expect(screen.getByText("Ethereum")).toBeInTheDocument();
    // Symbol appears in the label text; getAllByText covers badge + label.
    expect(screen.getAllByText("ETH").length).toBeGreaterThan(0);
  });

  it("renders both the USD and BTC prices", () => {
    render(<CryptoCard rate={RATE} />);
    expect(screen.getByText("$3,200.00")).toBeInTheDocument();
    expect(screen.getByText("₿0.05")).toBeInTheDocument();
  });

  it("exposes an accessible label and a reorder handle", () => {
    render(<CryptoCard rate={RATE} />);
    expect(
      screen.getByLabelText("Ethereum (ETH)")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /drag to reorder ethereum/i })
    ).toBeInTheDocument();
  });
});
