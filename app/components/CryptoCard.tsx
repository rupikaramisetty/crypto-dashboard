import { forwardRef } from "react";

import { CoinBadge } from "~/components/CoinBadge";
import type { CryptoRate } from "~/lib/crypto";
import { formatBtc, formatUsd } from "~/lib/format";

export interface CryptoCardProps {
  rate: CryptoRate;
  /** Whether this card is the one currently being dragged (raised styling). */
  isDragging?: boolean;
  /** Props for the drag handle button, supplied by the sortable wrapper. */
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  style?: React.CSSProperties;
}

/**
 * Presentational card for a single cryptocurrency. Purely visual: all drag
 * behaviour is injected via `dragHandleProps`/`ref` by `SortableCryptoCard`,
 * which keeps this component easy to test and reuse.
 */
export const CryptoCard = forwardRef<HTMLDivElement, CryptoCardProps>(
  function CryptoCard({ rate, isDragging = false, dragHandleProps, style }, ref) {
    return (
      <article
        ref={ref}
        style={style}
        data-testid={`crypto-card-${rate.symbol}`}
        aria-label={`${rate.name} (${rate.symbol})`}
        className={`group relative flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition dark:border-slate-800 dark:bg-slate-900 ${
          isDragging
            ? "scale-[1.02] cursor-grabbing border-indigo-400 shadow-xl ring-2 ring-indigo-400/40 dark:border-indigo-500"
            : "hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:hover:border-slate-700"
        }`}
      >
        <header className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <CoinBadge symbol={rate.symbol} />
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold leading-tight">
                {rate.name}
              </h2>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {rate.symbol}
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label={`Drag to reorder ${rate.name}`}
            title="Drag to reorder"
            {...dragHandleProps}
            className="touch-none rounded-md p-1.5 text-slate-300 transition hover:bg-slate-100 hover:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:cursor-grabbing dark:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-400"
          >
            <DragDots />
          </button>
        </header>

        <dl className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Price (USD)
            </dt>
            <dd className="mt-1 text-lg font-bold tabular-nums text-slate-900 dark:text-slate-50">
              {formatUsd(rate.usd)}
            </dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Price (BTC)
            </dt>
            <dd className="mt-1 text-lg font-bold tabular-nums text-amber-600 dark:text-amber-400">
              {formatBtc(rate.btc)}
            </dd>
          </div>
        </dl>
      </article>
    );
  }
);

function DragDots() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="5" cy="3" r="1.4" />
      <circle cx="11" cy="3" r="1.4" />
      <circle cx="5" cy="8" r="1.4" />
      <circle cx="11" cy="8" r="1.4" />
      <circle cx="5" cy="13" r="1.4" />
      <circle cx="11" cy="13" r="1.4" />
    </svg>
  );
}
