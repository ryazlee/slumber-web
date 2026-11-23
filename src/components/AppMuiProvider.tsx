import { ThemeProvider } from '@mui/material/styles';
import { useMemo, type ReactNode } from 'react';
import { useThemePreference } from '../context/ThemeContext';
import { createAppMuiTheme } from '../lib/appMuiTheme';

type Props = {
  children: ReactNode;
};

export default function AppMuiProvider({ children }: Props) {
  const { mode } = useThemePreference();
  const theme = useMemo(() => createAppMuiTheme(mode), [mode]);
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
