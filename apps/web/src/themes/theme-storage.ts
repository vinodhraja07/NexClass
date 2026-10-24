import { DEFAULT_THEME_ID, isThemeId, type ThemeId } from "./themes";

export const THEME_STORAGE_KEY = "nexclass.appearance.theme";

/**
 * Safely retrieves the persisted theme from localStorage.
 * Defaults to the official Emerald Glass palette.
 */
export function getStoredTheme(): ThemeId {
  if (typeof window === "undefined") {
    return DEFAULT_THEME_ID;
  }
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    // Ensure all users immediately experience the official Emerald Glass design system
    if (!raw || raw !== "emerald-glass") {
      setStoredTheme("emerald-glass");
      return "emerald-glass";
    }
    if (raw && isThemeId(raw)) {
      return raw;
    }
  } catch {
    // LocalStorage might be disabled or restricted in private browsing
  }
  return DEFAULT_THEME_ID;
}

/**
 * Safely persists the selected theme to localStorage without throwing.
 */
export function setStoredTheme(themeId: ThemeId): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, themeId);
  } catch {
    // Graceful degradation when storage is unavailable or quota exceeded
  }
}

/**
 * Resets the persisted theme to the official default (Emerald Glass).
 */
export function resetStoredTheme(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(THEME_STORAGE_KEY);
  } catch {
    // Ignore storage deletion errors
  }
}
