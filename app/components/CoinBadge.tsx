/**
 * A small circular badge showing the coin's symbol initials over a gradient
 * derived deterministically from the symbol — so each coin gets a stable,
 * distinct color without bundling an icon set.
 */

// A spread of pleasant gradient pairs (from/to Tailwind color stops).
const GRADIENTS = [
  "from-amber-400 to-orange-500",
  "from-indigo-400 to-violet-600",
  "from-sky-400 to-blue-600",
  "from-emerald-400 to-teal-600",
  "from-rose-400 to-pink-600",
  "from-fuchsia-400 to-purple-600",
  "from-lime-400 to-green-600",
  "from-cyan-400 to-sky-600",
  "from-red-400 to-rose-600",
  "from-yellow-400 to-amber-600",
];

function gradientFor(symbol: string): string {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = (hash * 31 + symbol.charCodeAt(i)) >>> 0;
  }
  return GRADIENTS[hash % GRADIENTS.length];
}

export function CoinBadge({ symbol }: { symbol: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white shadow-inner ${gradientFor(
        symbol
      )}`}
    >
      {symbol.slice(0, 3)}
    </span>
  );
}
