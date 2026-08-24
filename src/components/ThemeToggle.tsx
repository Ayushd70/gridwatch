"use client";

import { useSyncExternalStore } from "react";
import { applyTheme, readTheme, type Theme } from "@/lib/theme";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("gridwatch-theme", onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("gridwatch-theme", onStoreChange);
  };
}

function serverTheme(): Theme {
  return "dark";
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, readTheme, serverTheme);
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => applyTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface-2 text-foreground transition hover:border-accent/40 hover:text-accent"
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="4" />
      <path strokeLinecap="round" d="M12 3v1.6M12 19.4V21M4.6 4.6l1.1 1.1M18.3 18.3l1.1 1.1M3 12h1.6M19.4 12H21M4.6 19.4l1.1-1.1M18.3 5.7l1.1-1.1" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.5 15.2A7.2 7.2 0 0 1 9.3 6.4 7.3 7.3 0 1 0 17.5 15.2Z"
      />
    </svg>
  );
}
