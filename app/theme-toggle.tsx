"use client";

import { useEffect, useState } from "react";

export const THEME_STORAGE_KEY = "neerdrishti-theme";

type Theme = "light" | "dark";

function storedTheme(): Theme | null {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

function systemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function setDocumentTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = (nextTheme: Theme) => {
      setDocumentTheme(nextTheme);
      setTheme(nextTheme);
    };
    const syncPreference = () => sync(storedTheme() ?? systemTheme());
    const onSystemChange = () => {
      if (storedTheme() === null) sync(systemTheme());
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY || event.key === null) syncPreference();
    };
    const onThemeChange = (event: Event) => sync((event as CustomEvent<Theme>).detail);

    syncPreference();
    media.addEventListener("change", onSystemChange);
    window.addEventListener("storage", onStorage);
    window.addEventListener("neerdrishti-theme-change", onThemeChange);
    document.documentElement.classList.add("theme-ready");

    return () => {
      media.removeEventListener("change", onSystemChange);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("neerdrishti-theme-change", onThemeChange);
    };
  }, []);

  function toggleTheme() {
    const current = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    const next: Theme = current === "dark" ? "light" : "dark";
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // The active tab can still switch theme when storage is unavailable.
    }
    setDocumentTheme(next);
    setTheme(next);
    window.dispatchEvent(new CustomEvent<Theme>("neerdrishti-theme-change", { detail: next }));
  }

  const isDark = theme === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      aria-label={label}
      aria-pressed={isDark}
      className={`theme-toggle ${className}`.trim()}
      onClick={toggleTheme}
      title={label}
      type="button"
    >
      <svg aria-hidden="true" className="theme-icon theme-icon-sun" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3.5" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" />
      </svg>
      <svg aria-hidden="true" className="theme-icon theme-icon-moon" viewBox="0 0 24 24">
        <path d="M20.2 15.2A8.5 8.5 0 0 1 8.8 3.8 8.5 8.5 0 1 0 20.2 15.2Z" />
      </svg>
      <span className="sr-only">{label}</span>
    </button>
  );
}
