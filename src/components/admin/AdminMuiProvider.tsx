import { ThemeProvider } from '@mui/material/styles';
import { useMemo, type ReactNode } from 'react';
import { useThemePreference } from '../../context/ThemeContext';
import { createAdminMuiTheme } from './adminMuiTheme';

type Props = {
  children: ReactNode;
};

export default function AdminMuiProvider({ children }: Props) {
  const { mode } = useThemePreference();
  const theme = useMemo(() => createAdminMuiTheme(mode), [mode]);
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
