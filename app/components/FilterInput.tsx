export interface FilterInputProps {
  value: string;
  onChange: (value: string) => void;
  resultCount: number;
  totalCount: number;
}

export function FilterInput({
  value,
  onChange,
  resultCount,
  totalCount,
}: FilterInputProps) {
  return (
    <div className="w-full sm:max-w-xs">
      <label htmlFor="crypto-filter" className="sr-only">
        Filter cryptocurrencies
      </label>

      {/* Input wrapper is its own relative container so icon + clear button
          only position relative to the input row, not the hint <p> below. */}
      <div className="relative">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        >
          <SearchIcon />
        </span>

        <input
          id="crypto-filter"
          type="search"
          inputMode="search"
          autoComplete="off"
          placeholder="Filter by name or symbol…"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label="Filter cryptocurrencies by name or symbol"
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
        />

        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Clear filter"
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        )}
      </div>

      <p aria-live="polite" className="mt-1.5 h-4 pl-1 text-xs text-slate-400">
        {value ? `${resultCount} of ${totalCount} match "${value}"` : ""}
      </p>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
