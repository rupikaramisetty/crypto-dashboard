# 🪙 Crypto Dashboard

A real-time cryptocurrency dashboard built with **Remix + React + TypeScript**.
It displays live USD and BTC exchange rates from the **Coinbase API**, with
cookie-based authentication, filtering, drag-and-drop reordering, auto-refresh,
and a dark/light theme.

![Tech](https://img.shields.io/badge/Remix-2.x-black) ![Tech](https://img.shields.io/badge/React-18-blue) ![Tech](https://img.shields.io/badge/TypeScript-strict-3178c6) ![Unit tests](https://img.shields.io/badge/unit%20tests-34%20passing-brightgreen) ![E2E tests](https://img.shields.io/badge/e2e-47%20across%203%20devices-brightgreen)

---

## ✨ Features

| Requirement | Implementation |
| --- | --- |
| **Card layout** (≥10 coins, name, symbol, USD + BTC rate) | 12 coins in a responsive 1→2→3→4 column grid (`CryptoCard`) |
| **Dynamic data fetching** | Server-side Remix `loader` hits Coinbase on page load; manual **Refresh** button + opt-in **60s auto-refresh** |
| **Drag & drop reordering** | `@dnd-kit` with a dedicated drag handle, keyboard support, and a drag overlay; order persists on the page |
| **Filtering** | Live filter by **name or symbol** (e.g. `eth` → Ethereum) |

### Bonus features included

- ✅ **User authentication** — cookie-session login **and** signup, with validation, a duplicate-email guard, auto-login on registration, and a protected dashboard (see [Authentication](#-authentication))
- ✅ **Order persisted to `localStorage`** (survives reloads; "Reset order" button)
- ✅ **Dark / light mode toggle** (persisted, no flash-of-wrong-theme on load)
- ✅ **Loading, empty, and error states** (skeletons, inline retryable errors, stale-data banner)
- ✅ **Unit tests** (Vitest + Testing Library — 34 tests across formatting, filtering, ordering, the Coinbase fetch/transform incl. error paths, and the card component)
- ✅ **End-to-end tests** (Playwright — 47 tests run across Desktop, Mobile, and Tablet device profiles)

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
| `pnpm test` | Run the Vitest unit suite once |
| `pnpm test:watch` | Vitest in watch mode |
| `pnpm test:e2e` | Run the Playwright E2E suite (Desktop, Mobile, Tablet) |
| `pnpm test:e2e:ui` | Playwright in interactive UI mode |
| `pnpm test:all` | Run unit tests, then E2E tests |

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
│   ├── _index.tsx           # The dashboard (protected): loader (server fetch) + client orchestration
│   ├── login.tsx            # Sign-in page: action validates credentials + commits the session
│   ├── signup.tsx           # Registration page: validates input, registers, auto-logs-in
│   └── logout.tsx           # Action destroys the session and redirects to /login
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
    ├── session.server.ts    # Cookie session storage + getUserId / requireUserId helpers
    ├── auth.server.ts        # User store, credential validation, registration, session actions
    ├── crypto.ts            # Domain types, tracked-coin list, filter/order helpers
    ├── format.ts            # USD/BTC/relative-time formatting
    └── theme.ts             # Theme constants + the pre-paint init script
```

**Server vs. client split.** Fetching happens in the Remix `loader` (server),
so API details never reach the browser bundle (`*.server.ts`) and the first
paint already contains data (good for SEO/perf). The dashboard loader calls
`requireUserId`, redirecting unauthenticated visitors to `/login`. Interactive
state (filter text, card order, theme, refresh) lives on the client. Refresh
re-runs the loader via `useRevalidator`, so there's a single source of truth
for rates.

---

## 🔐 Authentication

The dashboard is gated behind a cookie-based session. Unauthenticated requests
to `/` are redirected to `/login?redirectTo=/`.

**Demo credentials** (pre-seeded):

```
email:    demo@example.com
password: password
```

You can also **create a new account** at `/signup` — name, email, and password
(min. 8 chars, with confirmation) are validated, duplicate emails are rejected,
and a successful signup logs you straight in.

**How it works**

- `app/lib/session.server.ts` configures `createCookieSessionStorage`
  (httpOnly, signed cookie) and exposes `getUserId` / `requireUserId`.
- `app/lib/auth.server.ts` holds the user store, `validateCredentials`,
  `registerUser`, and the `createUserSession` / `logout` actions.
- `app/routes/_index.tsx` calls `requireUserId` at the top of its loader, so
  the dashboard is unreachable without a valid session.

> **Demo simplifications:** the user store is in memory and passwords are not
> hashed, so accounts reset when the server restarts. Both are isolated to
> `auth.server.ts` and called out in [Decisions & tradeoffs](#-decisions--tradeoffs).

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
- **Authentication is cookie-session based, with an in-memory user store** —
  the Remix-idiomatic approach (`createCookieSessionStorage` + `requireUserId`
  in the loader). The user store lives in memory (`auth.server.ts`) and
  passwords are compared in plain text, which is deliberate for a no-infra demo:
  swapping in a real DB query and a bcrypt/argon2 hash is a localized change.
  New accounts created via signup persist for the lifetime of the server process.
- **Rates are indicative** — Coinbase exchange-rates are spot indicative values,
  fine for a dashboard demo; a trading app would use the order-book/ticker API.

---

## 🧪 Testing

### Unit tests (Vitest + Testing Library — 34 tests)

```bash
pnpm test
```

Focused on the logic most worth protecting:

- `lib/crypto.test.ts` — filtering by name/symbol; order application edge cases
  (missing ids, duplicates, appended coins).
- `lib/coinbase.test.ts` — the rate-math transform (USD/BTC derivation, skipping
  missing or malformed rates) **and** the fetch error handling (non-OK status,
  invalid JSON, missing BTC rate, network failure) via a mocked `fetch`.
- `lib/format.test.ts` — currency precision, BTC trimming, relative time.
- `components/CryptoCard.test.tsx` — renders name, symbol, both prices, and an
  accessible reorder handle.

### End-to-end tests (Playwright — 47 tests × 3 device profiles)

```bash
pnpm test:e2e          # headless run across Desktop, Mobile, Tablet
pnpm test:e2e:ui       # interactive UI mode
```

Run against the dev server (auto-started via `playwright.config.ts`) on
**Desktop Chrome**, **Mobile Safari (iPhone 12)**, and **Tablet (iPad Pro 11)**:

- `e2e/auth.spec.ts` — login validation, demo-credential sign-in, route
  protection, sign-out, and the full signup flow (validation, duplicate-email
  guard, auto-login).
- `e2e/dashboard.spec.ts` — card rendering, filtering by name/symbol, refresh
  and auto-refresh controls, theme toggle + persistence, and drag-handle state.
- `e2e/responsive.spec.ts` — responsive grid columns and no-horizontal-overflow
  checks per breakpoint.

---

## 🤖 Extending this project

See **[`AI_GUIDELINES.md`](./AI_GUIDELINES.md)** for conventions, the file map,
and step-by-step recipes (add a coin, add a column, add sorting, add auth) so a
human or an AI agent can ship follow-up features consistently.
