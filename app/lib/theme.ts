/**
 * Theme handling lives entirely on the client (no auth / server session in this
 * exercise), persisted to `localStorage`. The `<head>` runs `themeInitScript`
 * synchronously before paint to avoid a flash of the wrong theme on first load.
 */

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "crypto-dashboard:theme";

export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

/**
 * Inline script injected into the document head. It must be self-contained
 * (no imports) because it runs as a raw string before hydration. It resolves
 * the saved theme — falling back to the OS preference — and applies the `dark`
 * class to `<html>` so styles are correct on the very first paint.
 */
export const themeInitScript = `
(function () {
  try {
    var key = "${THEME_STORAGE_KEY}";
    var stored = localStorage.getItem(key);
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var theme = stored === "light" || stored === "dark" ? stored : (prefersDark ? "dark" : "light");
    var root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
  } catch (e) {}
})();
`;
