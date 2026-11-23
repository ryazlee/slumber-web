import { createTheme } from '@mui/material/styles';
import type { ThemeMode } from '../../lib/themePreference';

export function createAdminMuiTheme(mode: ThemeMode) {
  const dark = mode === 'dark';
  return createTheme({
    palette: {
      mode,
      primary: { main: '#7b3fa0' },
      background: {
        default: dark ? '#0f0f10' : '#f4f6f9',
        paper: dark ? '#18181a' : '#ffffff',
      },
      text: {
        primary: dark ? '#ececee' : '#0f172a',
        secondary: dark ? '#9b9ba3' : '#64748b',
      },
      divider: dark ? '#2a2a2e' : '#d5d9e1',
    },
    typography: {
      fontFamily: 'inherit',
      fontSize: 14,
    },
  });
}
