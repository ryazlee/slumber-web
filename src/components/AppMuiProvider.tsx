import { ThemeProvider } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { appMuiTheme } from '../lib/appMuiTheme';

type Props = {
  children: ReactNode;
};

export default function AppMuiProvider({ children }: Props) {
  return <ThemeProvider theme={appMuiTheme}>{children}</ThemeProvider>;
}
