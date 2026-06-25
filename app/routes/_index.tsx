import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { useLoaderData, useRevalidator } from "@remix-run/react";
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
import { usePersistedOrder } from "~/hooks/usePersistedOrder";
import { useAutoRefresh } from "~/hooks/useAutoRefresh";
import {
  CoinbaseError,
  fetchCryptoRates,
  type RatesPayload,
} from "~/lib/coinbase.server";
import { applyOrder, filterCryptos, type CryptoRate } from "~/lib/crypto";

const AUTO_REFRESH_MS = 60_000;

export const meta: MetaFunction = () => [
  { title: "Crypto Dashboard — Live Coinbase Rates" },
];

type LoaderData =
  | { ok: true; payload: RatesPayload }
  | { ok: false; error: string };

/**
 * Runs on the server on every page load (and on every revalidation triggered by
 * the refresh button / auto-refresh). We catch Coinbase failures and return a
 * typed error instead of throwing, so the UI can show an inline, retryable
 * error state without unmounting the whole page.
 */
export async function loader({ request }: LoaderFunctionArgs): Promise<LoaderData> {
  try {
    const payload = await fetchCryptoRates(request.signal);
    return { ok: true, payload };
  } catch (error) {
    const message =
      error instanceof CoinbaseError
        ? error.message
        : "An unexpected error occurred while loading exchange rates.";
    return { ok: false, error: message };
  }
}

export default function Index() {
  const data = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();
  const isRefreshing = revalidator.state === "loading";

  const { order, setOrder, resetOrder, hydrated } = usePersistedOrder();
  const [query, setQuery] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Keep the last successfully-loaded data so a transient refresh failure shows
  // a banner over stale-but-useful cards instead of wiping the dashboard.
  const [lastGood, setLastGood] = useState<RatesPayload | null>(
    data.ok ? data.payload : null
  );
  useEffect(() => {
    if (data.ok) setLastGood(data.payload);
  }, [data]);

  const refresh = useCallback(() => {
    revalidator.revalidate();
  }, [revalidator]);

  // Auto-refresh on an interval (paused when the tab is hidden, see the hook).
  useAutoRefresh(refresh, AUTO_REFRESH_MS, autoRefresh && lastGood !== null);

  // Memoised so the dependent useMemo hooks below have a stable reference even
  // while `lastGood` is null (otherwise `?? []` allocates a new array each render).
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

  // First load with no cached data and a hard error → full error state.
  const showFatalError = !data.ok && lastGood === null;
  // First load still in flight (no data yet) — only briefly on client nav.
  const showSkeleton = lastGood === null && data.ok;

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Header />

        {/* Toolbar */}
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

        {/* Stale-data warning banner (we have old cards but the latest refresh failed). */}
        {!data.ok && lastGood !== null && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300"
          >
            Showing the last known rates — the most recent refresh failed: {data.error}
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

        {/* Content */}
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

function Header() {
  return (
    <header className="flex items-start justify-between gap-4">
      <div>
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
      <ThemeToggle />
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
