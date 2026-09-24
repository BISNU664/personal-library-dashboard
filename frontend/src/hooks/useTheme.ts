import { useEffect, useState } from "react";

export type Theme = "dark" | "light";

// Keep in sync with the inline script in index.html, which applies the
// saved theme before React loads so the page doesn't flash the wrong colours.
const STORAGE_KEY = "theme";

function initialTheme(): Theme {
  const applied = document.documentElement.dataset.theme;
  return applied === "light" ? "light" : "dark";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Storage is unavailable (e.g. private mode); the choice lasts for the session.
    }
  }, [theme]);

  const toggleTheme = () =>
    setTheme((current) => (current === "dark" ? "light" : "dark"));

  return { theme, toggleTheme };
}
