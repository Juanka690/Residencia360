"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

const THEME_STORAGE_KEY = "residencia360-theme";

type ThemeMode = "light" | "dark";

function applyTheme(theme: ThemeMode) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
    setMounted(true);
  }, []);

  const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";

  return (
    <Button
      variant="outline"
      size="icon"
      type="button"
      aria-label={mounted ? `Cambiar a modo ${nextTheme === "dark" ? "oscuro" : "claro"}` : "Cambiar tema"}
      title={mounted ? `Cambiar a modo ${nextTheme === "dark" ? "oscuro" : "claro"}` : "Cambiar tema"}
      onClick={() => {
        applyTheme(nextTheme);
        setTheme(nextTheme);
      }}
    >
      {mounted && theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
