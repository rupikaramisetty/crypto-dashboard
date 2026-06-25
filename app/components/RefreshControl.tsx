import { useEffect, useState } from "react";

import { formatRelativeTime } from "~/lib/format";

export interface RefreshControlProps {
  fetchedAt: number | null;
  isRefreshing: boolean;
  onRefresh: () => void;
  autoRefresh: boolean;
  onToggleAutoRefresh: (next: boolean) => void;
  /** Interval label shown next to the auto-refresh toggle, e.g. "60s". */
  intervalLabel: string;
}

export function RefreshControl({
  fetchedAt,
  isRefreshing,
  onRefresh,
  autoRefresh,
  onToggleAutoRefresh,
  intervalLabel,
}: RefreshControlProps) {
  // Re-render every second so the "updated Xs ago" label stays current.
  const [now, setNow] = useState<number>(() => fetchedAt ?? 0);
  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            isRefreshing ? "animate-pulse bg-amber-400" : "bg-emerald-500"
          }`}
          aria-hidden="true"
        />
        <span aria-live="polite">
          {fetchedAt
            ? `Updated ${formatRelativeTime(fetchedAt, now)}`
            : "Not yet updated"}
        </span>
      </p>

      <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <input
          type="checkbox"
          checked={autoRefresh}
          onChange={(e) => onToggleAutoRefresh(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
        />
        Auto-refresh ({intervalLabel})
      </label>

      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        <RefreshIcon spinning={isRefreshing} />
        {isRefreshing ? "Refreshing…" : "Refresh"}
      </button>
    </div>
  );
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={spinning ? "animate-spin" : ""}
    >
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}
