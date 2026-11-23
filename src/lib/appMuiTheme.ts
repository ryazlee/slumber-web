import { createTheme } from '@mui/material/styles';
import type { ThemeMode } from './themePreference';

/** Matches `global.css` tokens — used for MUI Skeleton in the signed-in app shell. */
export function createAppMuiTheme(mode: ThemeMode) {
  const dark = mode === 'dark';
  return createTheme({
    palette: {
      mode,
      primary: { main: '#7b3fa0' },
      background: {
        default: dark ? '#0c0c0e' : '#f4f6f9',
        paper: dark ? '#17171a' : '#ffffff',
      },
      text: {
        primary: dark ? '#f4f4f5' : '#0f172a',
        secondary: dark ? '#a1a1aa' : '#64748b',
      },
      divider: dark ? 'rgba(255, 255, 255, 0.08)' : '#d5d9e1',
    },
    typography: {
      fontFamily: 'inherit',
      fontSize: 14,
    },
    components: {
      MuiSkeleton: {
        styleOverrides: {
          root: {
            backgroundColor: dark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.08)',
          },
        },
      },
    },
  });
}
