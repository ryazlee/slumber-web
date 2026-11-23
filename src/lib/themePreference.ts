export type ThemePreference = 'system' | 'light' | 'dark';
export type ThemeMode = 'light' | 'dark';

export const THEME_PREF_KEY = 'slumber.theme.preference';

export function readThemePreference(): ThemePreference {
  try {
    const saved = localStorage.getItem(THEME_PREF_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
  } catch {
    // Storage can be blocked in private contexts.
  }
  return 'system';
}

export function resolveThemeMode(preference: ThemePreference): ThemeMode {
  if (preference === 'light' || preference === 'dark') return preference;
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function applyTheme(preference: ThemePreference): ThemeMode {
  const mode = resolveThemeMode(preference);
  const root = document.documentElement;
  root.dataset.theme = mode;
  root.dataset.themePreference = preference;
  root.style.colorScheme = mode;
  return mode;
}

export function cycleThemePreference(preference: ThemePreference): ThemePreference {
  if (preference === 'system') return 'light';
  if (preference === 'light') return 'dark';
  return 'system';
}
