import { useCallback, useEffect, useState } from "react";

import { THEME_STORAGE_KEY, isTheme, type Theme } from "~/lib/theme";

/**
 * Reads/writes the active theme. The initial `<html class="dark">` is set by
 * the inline script in `root.tsx` before hydration; here we read it back so the
 * React state matches the DOM, then keep both in sync on toggle.
 */
export function useTheme(): { theme: Theme; toggleTheme: () => void } {
  const [theme, setTheme] = useState<Theme>("light");

  // Sync state from the DOM after hydration (the inline script already applied it).
  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (isTheme(stored)) {
      setTheme(stored);
      return;
    }
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  const apply = useCallback((next: Theme) => {
    setTheme(next);
    const root = document.documentElement;
    root.classList.toggle("dark", next === "dark");
    root.style.colorScheme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Ignore storage failures (e.g. private mode); the toggle still works in-session.
    }
  }, []);

  const toggleTheme = useCallback(() => {
    apply(theme === "dark" ? "light" : "dark");
  }, [apply, theme]);

  return { theme, toggleTheme };
}
