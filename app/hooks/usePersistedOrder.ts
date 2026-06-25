import { useCallback, useEffect, useState } from "react";

const ORDER_STORAGE_KEY = "crypto-dashboard:card-order";

function readOrder(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ORDER_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.every((x) => typeof x === "string")
      ? parsed
      : [];
  } catch {
    return [];
  }
}

/**
 * Persists the user's drag-and-drop card order to `localStorage` so it survives
 * reloads. Returns the saved order (empty until hydration completes, so the
 * server-rendered default order is used first) and a setter that writes through.
 */
export function usePersistedOrder(): {
  order: string[];
  setOrder: (next: string[]) => void;
  resetOrder: () => void;
  hydrated: boolean;
} {
  const [order, setOrderState] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setOrderState(readOrder());
    setHydrated(true);
  }, []);

  const setOrder = useCallback((next: string[]) => {
    setOrderState(next);
    try {
      window.localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Non-fatal: order still applies for the current session.
    }
  }, []);

  const resetOrder = useCallback(() => {
    setOrderState([]);
    try {
      window.localStorage.removeItem(ORDER_STORAGE_KEY);
    } catch {
      // Non-fatal.
    }
  }, []);

  return { order, setOrder, resetOrder, hydrated };
}
