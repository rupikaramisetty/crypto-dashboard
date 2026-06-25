import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Form, useLoaderData, useRevalidator } from "@remix-run/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { CryptoGrid } from "~/components/CryptoGrid";
import { FilterInput } from "~/components/FilterInput";
import { RefreshControl } from "~/components/RefreshControl";
import { ThemeToggle } from "~/components/ThemeToggle";
import {
  CardSkeletonGrid,
  EmptyState,
  ErrorState,
} from "~/components/states";
import { useAutoRefresh } from "~/hooks/useAutoRefresh";
import { usePersistedOrder } from "~/hooks/usePersistedOrder";
import { getUser, type User } from "~/lib/auth.server";
import {
  CoinbaseError,
  fetchCryptoRates,
  type RatesPayload,
} from "~/lib/coinbase.server";
import { applyOrder, filterCryptos, type CryptoRate } from "~/lib/crypto";
import { requireUserId } from "~/lib/session.server";

const AUTO_REFRESH_MS = 60_000;

export const meta: MetaFunction = () => [
  { title: "Crypto Dashboard — Live Coinbase Rates" },
];

type LoaderData =
  | { ok: true; payload: RatesPayload; user: User }
  | { ok: false; error: string; user: User };

export async function loader({ request }: LoaderFunctionArgs): Promise<LoaderData> {
  // Redirect to /login if not authenticated.
  await requireUserId(request);
  const user = (await getUser(request))!;

  try {
    const payload = await fetchCryptoRates(request.signal);
    return { ok: true, payload, user };
  } catch (error) {
    const message =
      error instanceof CoinbaseError
        ? error.message
        : "An unexpected error occurred while loading exchange rates.";
    return { ok: false, error: message, user };
  }
}

export default function Index() {
  const data = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();
  const isRefreshing = revalidator.state === "loading";

  const { order, setOrder, resetOrder, hydrated } = usePersistedOrder();
  const [query, setQuery] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const [lastGood, setLastGood] = useState<RatesPayload | null>(
    data.ok ? data.payload : null
  );
  useEffect(() => {
    if (data.ok) setLastGood(data.payload);
  }, [data]);

  const refresh = useCallback(() => {
    revalidator.revalidate();
  }, [revalidator]);

  useAutoRefresh(refresh, AUTO_REFRESH_MS, autoRefresh && lastGood !== null);

  const baseRates: CryptoRate[] = useMemo(
    () => lastGood?.rates ?? [],
    [lastGood]
  );
  const totalCount = baseRates.length;

  const ordered = useMemo(
    () => applyOrder(baseRates, order, (r) => r.symbol),
    [baseRates, order]
  );
  const filtered = useMemo(
    () => filterCryptos(ordered, query),
    [ordered, query]
  );

  const isFiltering = query.trim().length > 0;
  const hasCustomOrder = hydrated && order.length > 0;

  function handleReorder(orderedSymbols: string[]) {
    setOrder(orderedSymbols);
  }

  const showFatalError = !data.ok && lastGood === null;
  const showSkeleton = lastGood === null && data.ok;

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Header user={data.user} />

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <FilterInput
            value={query}
            onChange={setQuery}
            resultCount={filtered.length}
            totalCount={totalCount}
          />
          {lastGood && (
            <RefreshControl
              fetchedAt={lastGood.fetchedAt}
              isRefreshing={isRefreshing}
              onRefresh={refresh}
              autoRefresh={autoRefresh}
              onToggleAutoRefresh={setAutoRefresh}
              intervalLabel={`${AUTO_REFRESH_MS / 1000}s`}
            />
          )}
        </div>

        {!data.ok && lastGood !== null && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300"
          >
            Showing the last known rates — the most recent refresh failed:{" "}
            {data.error}
          </p>
        )}

        {(hasCustomOrder || isFiltering) && (
          <div className="mt-4 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            {isFiltering ? (
              <span>Drag-to-reorder is paused while filtering.</span>
            ) : (
              <span>Drag the ⠿ handle on a card to reorder.</span>
            )}
            {hasCustomOrder && !isFiltering && (
              <button
                type="button"
                onClick={resetOrder}
                className="font-medium text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400"
              >
                Reset order
              </button>
            )}
          </div>
        )}

        <div className="mt-6">
          {showFatalError ? (
            <ErrorState
              message={!data.ok ? data.error : ""}
              onRetry={refresh}
              retrying={isRefreshing}
            />
          ) : showSkeleton ? (
            <CardSkeletonGrid />
          ) : filtered.length === 0 ? (
            <EmptyState query={query} />
          ) : (
            <CryptoGrid
              rates={filtered}
              onReorder={handleReorder}
              sortingEnabled={!isFiltering}
            />
          )}
        </div>

        <Footer />
      </div>
    </div>
  );
}

function Header({ user }: { user: User }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500">
          Live Coinbase Rates
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
          Crypto Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Real-time exchange rates in USD and BTC. Filter, refresh, and drag to
          reorder.
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* User badge */}
        <div className="hidden items-center gap-2 sm:flex">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
            {user.name.charAt(0).toUpperCase()}
          </span>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {user.name}
          </span>
        </div>

        {/* Logout */}
        <Form method="post" action="/logout">
          <button
            type="submit"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Sign out
          </button>
        </Form>

        <ThemeToggle />
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-10 border-t border-slate-200 pt-6 text-center text-xs text-slate-400 dark:border-slate-800">
      Data from the{" "}
      <a
        href="https://docs.cdp.coinbase.com/coinbase-app/docs/api-exchange-rates"
        target="_blank"
        rel="noreferrer"
        className="font-medium text-slate-500 underline-offset-2 hover:underline dark:text-slate-300"
      >
        Coinbase Exchange Rates API
      </a>
      . Prices are indicative and for demonstration only.
    </footer>
  );
}
