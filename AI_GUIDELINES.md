# AI / Contributor Guidelines

Conventions and recipes for shipping follow-up features in this codebase. These
are written so that either a human contributor or an AI coding agent can make
changes that stay consistent with the existing architecture.

> This file doubles as the project's `CLAUDE.md`-style guide. Keep it updated
> when conventions change.

---

## Golden rules

1. **Keep server-only code in `*.server.ts`.** Anything that touches an external
   API, a secret, or Node-only APIs must live in a `.server.ts` module so it is
   stripped from the browser bundle. `coinbase.server.ts` is the model.
2. **Presentational components stay dumb.** Components in `app/components`
   receive data and callbacks via props and render markup. Side effects, data
   fetching, and persistence live in the route (`_index.tsx`) or in `hooks/`.
   `CryptoCard` (pure) vs. `SortableCryptoCard` (behaviour wrapper) is the
   pattern to copy.
3. **Pure logic goes in `app/lib` and gets a unit test.** Formatting, filtering,
   ordering, and rate math are framework-free and tested in isolation. New pure
   logic should follow suit (`*.test.ts` colocated next to the source).
4. **Type strictly.** `tsconfig` runs in `strict` mode with `noUnusedLocals` /
   `noUnusedParameters`. No `any` — model new API shapes with explicit
   interfaces. Prefer discriminated unions for success/error states (see the
   loader's `LoaderData`).
5. **Accessibility is not optional.** Interactive elements need labels/roles;
   ESLint's `jsx-a11y` rules are enforced. Run `pnpm lint` before finishing.
6. **Definition of done:** `pnpm typecheck && pnpm lint && pnpm test` all pass,
   and `pnpm build` succeeds. For changes to user-facing flows, also run the
   Playwright E2E suite (`pnpm test:e2e`).

---

## Project map (where things live)

| I want to change… | Edit… |
| --- | --- |
| Which coins are shown / their names / default order | `app/lib/crypto.ts` → `TRACKED_COINS` |
| How prices are fetched / the rate math | `app/lib/coinbase.server.ts` |
| Number / currency / time formatting | `app/lib/format.ts` |
| A single card's look | `app/components/CryptoCard.tsx` |
| Drag-and-drop behaviour | `app/components/CryptoGrid.tsx` + `SortableCryptoCard.tsx` |
| The filter box | `app/components/FilterInput.tsx` |
| Refresh / auto-refresh UI | `app/components/RefreshControl.tsx` + `hooks/useAutoRefresh.ts` |
| Loading / empty / error visuals | `app/components/states.tsx` |
| Theme behaviour | `app/hooks/useTheme.ts` + `app/lib/theme.ts` |
| Page composition / data orchestration | `app/routes/_index.tsx` |
| Login / signup / logout pages | `app/routes/login.tsx` · `signup.tsx` · `logout.tsx` |
| Auth: user store, credentials, registration, sessions | `app/lib/auth.server.ts` |
| Cookie session config + `requireUserId` guard | `app/lib/session.server.ts` |
| Global document, fonts, error boundary | `app/root.tsx` |

---

## Recipes

### ➕ Add a new cryptocurrency

1. Add an entry to `TRACKED_COINS` in `app/lib/crypto.ts`:
   ```ts
   { symbol: "ATOM", name: "Cosmos" },
   ```
   The `symbol` **must** be a key Coinbase returns (check
   `https://api.coinbase.com/v2/exchange-rates?currency=USD`). Unknown symbols
   are skipped automatically, never crash.
2. Done — no other changes needed. The badge color is derived from the symbol.

### 🧮 Add a new data column (e.g. EUR price or 24h change)

1. Extend `CryptoRate` in `app/lib/crypto.ts` with the new field.
2. Populate it in `mapRates()` (`coinbase.server.ts`). If it needs another API
   call, fetch it there and keep the merge logic server-side.
3. Add a formatter to `app/lib/format.ts` (+ a test).
4. Render it in `CryptoCard.tsx` inside the `<dl>` grid.
5. Update `coinbase.test.ts` for the new transform.

> Note: Coinbase exchange-rates does not provide historical/percent-change data.
> For "24h change" you'd switch to the Coinbase spot/candles API or another
> provider — isolate that behind a new `*.server.ts` module.

### ↕️ Add column sorting (by price, name, etc.)

1. Add a `sortBy` state in `_index.tsx` and a small `<select>` in the toolbar.
2. Write a pure `sortCryptos(rates, sortBy)` helper in `app/lib/crypto.ts` (+ test).
3. Apply it in the existing `useMemo` chain **before** `filterCryptos`.
4. Decide how it interacts with manual drag order (e.g. choosing a sort clears
   the persisted manual order, or sorting is a separate "view"). Document the choice.

### 🔄 Change the refresh interval

Edit `AUTO_REFRESH_MS` in `app/routes/_index.tsx`. The hook already pauses
refresh while the browser tab is hidden.

### 🔐 Authentication (already implemented)

Auth is wired up the Remix-idiomatic way, cookie-session based:

- `app/lib/session.server.ts` — `createCookieSessionStorage` (httpOnly, signed)
  plus `getSession` / `getUserId` / `requireUserId`.
- `app/lib/auth.server.ts` — the user store (`DEMO_USERS`), `validateCredentials`,
  `registerUser`, and the `createUserSession` / `logout` / `getUser` actions.
- `app/routes/login.tsx`, `signup.tsx`, `logout.tsx` — the auth pages/actions.
- `app/routes/_index.tsx` — calls `requireUserId` at the top of its loader, so
  the dashboard redirects to `/login?redirectTo=…` when there's no session.

**To protect a new route:** call `await requireUserId(request)` (or `getUser`)
at the top of its `loader`/`action`.

**Demo simplifications to replace for production:**

1. **Persistence** — `DEMO_USERS` is an in-memory array, so accounts reset on
   server restart. Swap it for a real DB query (users keyed by email/id).
2. **Password hashing** — passwords are compared in plain text. Replace the
   comparison in `validateCredentials` and the store in `registerUser` with a
   bcrypt/argon2 hash + verify.
3. **Per-user data** — card order/theme are still device-local in `localStorage`.
   For cross-device sync, persist them server-side keyed by user id.

### 🎨 Styling conventions

- Tailwind utility classes, mobile-first. Use the `dark:` variant for dark mode
  (the strategy is `class`, toggled on `<html>`).
- Reuse the existing scale: cards `rounded-2xl`, inner tiles `rounded-xl`,
  `border-slate-200 dark:border-slate-800`, accent color `indigo`.
- Prefer semantic HTML (`<article>`, `<dl>/<dt>/<dd>`, `<button type="button">`).

---

## Gotchas

- **Hydration:** `localStorage`-derived state (theme, card order) must start from
  a value that matches the server render, then sync in a `useEffect`. Don't read
  `localStorage` during render. The theme's pre-paint script in `root.tsx`
  handles the visual flash separately from React state.
- **`pnpm` build scripts:** new deps with postinstall steps (native binaries)
  must be added to `allowBuilds` in `pnpm-workspace.yaml`, or installs warn and
  skip them.
- **Vitest config:** `vite.config.ts` disables the Remix Vite plugin under
  Vitest (`process.env.VITEST`) because they're incompatible. Keep test files as
  `app/**/*.test.{ts,tsx}`.
