"use client";

import { useSyncExternalStore } from "react";

import { MoonIcon, SunIcon } from "@/components/icons";
import { currentTheme, subscribeToTheme, toggleTheme } from "@/lib/theme";

/** The light/dark switch. The server can't know the theme, so it reports null
 * and the button stays hidden until then, rather than showing the wrong icon. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const mode = useSyncExternalStore(subscribeToTheme, currentTheme, () => null);
  const label = mode === "dark" ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-opacity ${
        mode ? "opacity-100" : "opacity-0"
      } ${className}`}
    >
      {mode === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
