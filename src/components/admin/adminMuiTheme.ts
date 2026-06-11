import { createTheme } from '@mui/material/styles';

export const adminMuiTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#7b3fa0' },
    background: {
      default: '#0f0f10',
      paper: '#18181a',
    },
    text: {
      primary: '#ececee',
      secondary: '#9b9ba3',
    },
    divider: '#2a2a2e',
  },
  typography: {
    fontFamily: 'inherit',
    fontSize: 14,
  },
});
