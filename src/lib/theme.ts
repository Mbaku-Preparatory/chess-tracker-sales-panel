/**
 * Light or dark, chosen the way chess-tracker-frontend chooses: someone who has
 * never picked gets their device's setting; once they flip the switch, their
 * choice wins. The `dark` class on <html> is the one source of truth.
 */

export type ThemeMode = "light" | "dark";

const THEME_KEY = "theme";

/**
 * Inlined into <head> so the class is on <html> before the first paint. React
 * runs too late for that: the page would render light and flick to dark.
 */
export const THEME_SCRIPT = `(function(){try{var s=localStorage.getItem(${JSON.stringify(THEME_KEY)});var d=s?s==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

const listeners = new Set<() => void>();

export function subscribeToTheme(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function currentTheme(): ThemeMode {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function toggleTheme() {
  const next: ThemeMode = currentTheme() === "dark" ? "light" : "dark";
  document.documentElement.classList.toggle("dark", next === "dark");
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    // Private mode or blocked storage: the switch still works for this visit.
  }
  listeners.forEach((listener) => listener());
}
