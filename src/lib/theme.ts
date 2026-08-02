import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

const KEY = "ethere.theme";
const listeners = new Set<() => void>();
let current: Theme = "dark";

function systemTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function apply(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
}

/** Reads stored/system preference and applies it. Safe to call repeatedly. */
export function initTheme() {
  if (typeof window === "undefined") return;
  const stored = window.localStorage.getItem(KEY) as Theme | null;
  current = stored === "light" || stored === "dark" ? stored : systemTheme();
  apply(current);
  emit();
}

function emit() {
  for (const l of listeners) l();
}

export function setTheme(theme: Theme) {
  current = theme;
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    root.classList.add("theme-transition");
    window.setTimeout(() => root.classList.remove("theme-transition"), 340);
  }
  apply(theme);
  try {
    window.localStorage.setItem(KEY, theme);
  } catch {
    /* ignore */
  }
  emit();
}

export function toggleTheme() {
  setTheme(current === "dark" ? "light" : "dark");
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useTheme() {
  const theme = useSyncExternalStore(
    subscribe,
    () => current,
    () => "dark" as Theme,
  );
  return { theme, setTheme, toggleTheme };
}
