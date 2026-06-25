/**
 * Loading, empty, and error presentational states for the dashboard grid.
 */

export function CardSkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="relative h-[164px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
        >
          <Shimmer />
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="space-y-2">
              <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-2.5 w-12 rounded bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800/60" />
            <div className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800/60" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Shimmer() {
  return (
    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/5" />
  );
}

export function EmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-700">
      <p className="text-4xl" aria-hidden="true">
        🔍
      </p>
      <p className="mt-3 font-semibold">No coins match “{query}”</p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Try a different name or ticker symbol.
      </p>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  retrying,
}: {
  message: string;
  onRetry: () => void;
  retrying: boolean;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 py-12 text-center dark:border-rose-900/60 dark:bg-rose-950/30"
    >
      <p className="text-3xl" aria-hidden="true">
        ⚠️
      </p>
      <p className="mt-3 font-semibold text-rose-700 dark:text-rose-300">
        Couldn’t load exchange rates
      </p>
      <p className="mt-1 max-w-sm text-sm text-rose-600/80 dark:text-rose-400/80">
        {message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        disabled={retrying}
        className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-60"
      >
        {retrying ? "Retrying…" : "Try again"}
      </button>
    </div>
  );
}
