import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_THEME_ID,
  THEMES,
  THEME_LIST,
  isThemeId,
  type ThemeDefinition,
  type ThemeId,
} from "./themes";
import { getStoredTheme, resetStoredTheme, setStoredTheme } from "./theme-storage";

export interface ThemeContextValue {
  theme: ThemeId;
  themeDef: ThemeDefinition;
  allThemes: ThemeDefinition[];
  setTheme: (themeId: ThemeId) => void;
  resetTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeId;
}

export function ThemeProvider({ children, defaultTheme }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    if (defaultTheme && isThemeId(defaultTheme)) return defaultTheme;
    return getStoredTheme();
  });

  // Apply theme attribute to document on initial mount and update
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
  }, [theme]);

  const setTheme = useCallback((nextTheme: ThemeId) => {
    if (!isThemeId(nextTheme)) return;

    const root = document.documentElement;
    // Add smooth transition class for 420ms across all theme-dependent elements
    root.classList.add("theme-transitioning");
    root.setAttribute("data-theme", nextTheme);

    setThemeState(nextTheme);
    setStoredTheme(nextTheme);

    const timer = window.setTimeout(() => {
      root.classList.remove("theme-transitioning");
    }, 450);

    return () => window.clearTimeout(timer);
  }, []);

  const resetTheme = useCallback(() => {
    resetStoredTheme();
    setTheme(DEFAULT_THEME_ID);
  }, [setTheme]);

  const value = useMemo<ThemeContextValue>(() => {
    return {
      theme,
      themeDef: THEMES[theme] ?? THEMES[DEFAULT_THEME_ID],
      allThemes: THEME_LIST,
      setTheme,
      resetTheme,
    };
  }, [theme, setTheme, resetTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Hook to access the current NexClass theme and switcher controls.
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a <ThemeProvider> tree.");
  }
  return context;
}
