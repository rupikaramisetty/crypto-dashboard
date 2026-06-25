# 🪙 Crypto Dashboard

A real-time cryptocurrency dashboard built with **Remix + React + TypeScript**.
It displays live USD and BTC exchange rates from the **Coinbase API**, with
filtering, drag-and-drop reordering, auto-refresh, and a dark/light theme.

![Tech](https://img.shields.io/badge/Remix-2.x-black) ![Tech](https://img.shields.io/badge/React-18-blue) ![Tech](https://img.shields.io/badge/TypeScript-strict-3178c6) ![Tests](https://img.shields.io/badge/tests-34%20passing-brightgreen)

---

## ✨ Features

| Requirement | Implementation |
| --- | --- |
| **Card layout** (≥10 coins, name, symbol, USD + BTC rate) | 12 coins in a responsive 1→2→3→4 column grid (`CryptoCard`) |
| **Dynamic data fetching** | Server-side Remix `loader` hits Coinbase on page load; manual **Refresh** button + opt-in **60s auto-refresh** |
| **Drag & drop reordering** | `@dnd-kit` with a dedicated drag handle, keyboard support, and a drag overlay; order persists on the page |
| **Filtering** | Live filter by **name or symbol** (e.g. `eth` → Ethereum) |

### Bonus features included

- ✅ **Order persisted to `localStorage`** (survives reloads; "Reset order" button)
- ✅ **Dark / light mode toggle** (persisted, no flash-of-wrong-theme on load)
- ✅ **Loading, empty, and error states** (skeletons, inline retryable errors, stale-data banner)
- ✅ **Unit tests** (Vitest + Testing Library — 34 tests across formatting, filtering, ordering, the Coinbase fetch/transform incl. error paths, and the card component)
- ⬜ User authentication — intentionally skipped (see [Tradeoffs](#-decisions--tradeoffs))

---

## 🚀 Setup

**Requirements:** Node `>=20`, [pnpm](https://pnpm.io) (the repo also works with `npm`/`yarn`).

```bash
# 1. Install dependencies
pnpm install

# 2. Run the dev server  →  http://localhost:3000
pnpm dev
```

### All scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the Remix dev server (HMR) |
| `pnpm build` | Production build (client + SSR bundles) |
| `pnpm start` | Serve the production build |
| `pnpm typecheck` | `tsc --noEmit` (strict mode) |
| `pnpm lint` | ESLint (a11y, hooks, import, TS rules) |
| `pnpm test` | Run the Vitest suite once |
| `pnpm test:watch` | Vitest in watch mode |

> **Note on pnpm:** pnpm blocks dependency build scripts by default. This repo
> pre-approves `esbuild` (needed by Vite) in `pnpm-workspace.yaml`, so a fresh
> `pnpm install` works with no extra steps.

No API keys or environment variables are required — the Coinbase
[exchange-rates endpoint](https://docs.cdp.coinbase.com/coinbase-app/docs/api-exchange-rates)
is public.

---

## 🏗️ How it works

### Data flow

The dashboard needs each coin's price **in USD** and **in BTC**. Coinbase's
`GET /v2/exchange-rates?currency=USD` returns a single map of
`symbol → "units of that currency per 1 USD"`. From that one call we derive
everything:

```
USD price of coin X = 1 / rates[X]
BTC price of coin X = rates[BTC] / rates[X]
```

This keeps us to **one network request per refresh** (`app/lib/coinbase.server.ts`).

### Architecture

```
app/
├── root.tsx                 # Document shell, fonts, no-flash theme script, error boundary
├── routes/
│   └── _index.tsx           # The dashboard: loader (server fetch) + client orchestration
├── components/
│   ├── CryptoCard.tsx       # Presentational card (no DnD logic — easy to test)
│   ├── SortableCryptoCard.tsx  # Wraps CryptoCard with @dnd-kit sortable behaviour
│   ├── CryptoGrid.tsx       # DndContext + responsive grid; disables DnD while filtering
│   ├── CoinBadge.tsx        # Deterministic gradient avatar per symbol
│   ├── FilterInput.tsx      # Accessible search/filter box
│   ├── RefreshControl.tsx   # Last-updated label, refresh button, auto-refresh toggle
│   ├── ThemeToggle.tsx      # Dark/light switch
│   └── states.tsx           # Skeleton, empty, and error states
├── hooks/
│   ├── useTheme.ts          # Theme state synced with <html> + localStorage
│   ├── usePersistedOrder.ts # Card order ↔ localStorage
│   └── useAutoRefresh.ts    # Interval refresh, paused when tab is hidden
└── lib/
    ├── coinbase.server.ts   # Server-only Coinbase fetch + rate transform
    ├── crypto.ts            # Domain types, tracked-coin list, filter/order helpers
    ├── format.ts            # USD/BTC/relative-time formatting
    └── theme.ts             # Theme constants + the pre-paint init script
```

**Server vs. client split.** Fetching happens in the Remix `loader` (server),
so API details never reach the browser bundle (`*.server.ts`) and the first
paint already contains data (good for SEO/perf). Interactive state
(filter text, card order, theme, refresh) lives on the client. Refresh re-runs
the loader via `useRevalidator`, so there's a single source of truth for rates.

---

## 🤔 Decisions & tradeoffs

- **`@dnd-kit` over `react-beautiful-dnd`** — the latter is unmaintained and has
  React 18 StrictMode issues. `@dnd-kit` is modern, accessible (keyboard
  reordering works), and tree-shakeable.
- **Drag is disabled while filtering** — reordering a partial list has ambiguous
  semantics (where does a dragged card land in the hidden remainder?). The UI
  shows a hint instead. Clearing the filter restores drag.
- **Resilient refresh** — a failed *refresh* keeps the last good data on screen
  with a warning banner rather than blanking the dashboard; only a failed
  *initial* load shows the full error state. Both are retryable.
- **Static coin metadata** — Coinbase returns symbols but not names, so display
  names live in a small curated list (`TRACKED_COINS`). This also lets us
  control which coins appear and their default order.
- **Tailwind for styling** — fast to write, consistent spacing/scales, and
  trivial dark-mode via the `dark:` variant + `class` strategy.
- **No authentication** — listed as optional. With no per-user data to protect
  (rates are public, order/theme are device-local in `localStorage`), auth would
  add ceremony without real value for this exercise. See `AI_GUIDELINES.md` for
  how I'd add it if required.
- **Rates are indicative** — Coinbase exchange-rates are spot indicative values,
  fine for a dashboard demo; a trading app would use the order-book/ticker API.

---

## 🧪 Testing

```bash
pnpm test
```

Tests focus on the logic most worth protecting:

- `lib/crypto.test.ts` — filtering by name/symbol; order application edge cases
  (missing ids, duplicates, appended coins).
- `lib/coinbase.test.ts` — the rate-math transform (USD/BTC derivation, skipping
  missing or malformed rates) **and** the fetch error handling (non-OK status,
  invalid JSON, missing BTC rate, network failure) via a mocked `fetch`.
- `lib/format.test.ts` — currency precision, BTC trimming, relative time.
- `components/CryptoCard.test.tsx` — renders name, symbol, both prices, and an
  accessible reorder handle.

---

## 🤖 Extending this project

See **[`AI_GUIDELINES.md`](./AI_GUIDELINES.md)** for conventions, the file map,
and step-by-step recipes (add a coin, add a column, add sorting, add auth) so a
human or an AI agent can ship follow-up features consistently.
