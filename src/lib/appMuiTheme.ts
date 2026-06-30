import { createTheme } from '@mui/material/styles';

/** Matches `global.css` tokens — used for MUI Skeleton in the signed-in app shell. */
export const appMuiTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#7b3fa0' },
    background: {
      default: '#0c0c0e',
      paper: '#17171a',
    },
    text: {
      primary: '#f4f4f5',
      secondary: '#a1a1aa',
    },
    divider: 'rgba(255, 255, 255, 0.08)',
  },
  typography: {
    fontFamily: 'inherit',
    fontSize: 14,
  },
  components: {
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.06)',
        },
      },
    },
  },
});
