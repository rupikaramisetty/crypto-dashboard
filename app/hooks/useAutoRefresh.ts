import { useEffect, useRef } from "react";

/**
 * Calls `callback` every `intervalMs` while `enabled` is true. The latest
 * `callback` is always invoked (no stale closures) without resetting the timer,
 * and the interval is paused while the document is hidden to avoid pointless
 * background fetches.
 */
export function useAutoRefresh(
  callback: () => void,
  intervalMs: number,
  enabled: boolean
): void {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled || intervalMs <= 0) return;

    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        savedCallback.current();
      }
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [enabled, intervalMs]);
}
