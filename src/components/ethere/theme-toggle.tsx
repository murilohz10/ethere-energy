import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { initTheme, useTheme } from "@/lib/theme";

/** Light/dark switch — persisted in localStorage, system-aware on first visit. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    initTheme();
    setMounted(true);
  }, []);

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
      title={isDark ? "Modo claro" : "Modo escuro"}
      className={cn(
        "group relative grid h-9 w-9 place-items-center overflow-hidden rounded-lg border border-border bg-surface text-muted-foreground",
        "transition-all duration-200 hover:border-primary/40 hover:text-foreground",
        className,
      )}
    >
      <Sun
        className={cn(
          "absolute h-4 w-4 transition-all duration-300",
          mounted && !isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0",
        )}
      />
      <Moon
        className={cn(
          "absolute h-4 w-4 transition-all duration-300",
          !mounted || isDark ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-50 opacity-0",
        )}
      />
    </button>
  );
}
