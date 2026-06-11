import { ThemeProvider } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { adminMuiTheme } from './adminMuiTheme';

type Props = {
  children: ReactNode;
};

export default function AdminMuiProvider({ children }: Props) {
  return <ThemeProvider theme={adminMuiTheme}>{children}</ThemeProvider>;
}
