import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  applyTheme,
  readThemePreference,
  resolveThemeMode,
  THEME_PREF_KEY,
  type ThemeMode,
  type ThemePreference,
} from '../lib/themePreference';

type ThemeContextValue = {
  preference: ThemePreference;
  mode: ThemeMode;
  setPreference: (next: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => readThemePreference());
  const [mode, setMode] = useState<ThemeMode>(() => resolveThemeMode(readThemePreference()));

  useEffect(() => {
    setMode(applyTheme(preference));
    if (preference !== 'system') return undefined;
    const query = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = () => setMode(applyTheme('system'));
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [preference]);

  const setPreference = (next: ThemePreference) => {
    setPreferenceState(next);
    try {
      localStorage.setItem(THEME_PREF_KEY, next);
    } catch {
      // Keep the in-memory choice if storage is unavailable.
    }
    setMode(applyTheme(next));
  };

  const value = useMemo(
    () => ({ preference, mode, setPreference }),
    [preference, mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemePreference(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemePreference must be used within ThemeProvider');
  return ctx;
}
