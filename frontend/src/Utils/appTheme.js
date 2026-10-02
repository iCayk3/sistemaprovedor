import { createTheme } from '@mui/material/styles';

export const appTheme = createTheme({
  palette: {
    primary: {
      main: '#0f4c81',
      light: '#2f80c0',
      dark: '#0a3256',
    },
    secondary: {
      main: '#f97316',
    },
  },
  typography: {
    fontFamily: "'Lato', sans-serif",
    fontSize: 16,
  },
  colorSchemes: {
    light: {
      palette: {
        primary: {
          main: '#0f4c81',
          light: '#2f80c0',
          dark: '#0a3256',
        },
        secondary: {
          main: '#f97316',
        },
        background: {
          default: '#f5f8fb',
          paper: '#ffffff',
        },
        text: {
          primary: '#0f2630',
          secondary: '#475569',
        },
      },
    },
    dark: {
      palette: {
        primary: {
          main: '#1677bd',
          light: '#38bdf8',
          dark: '#0369a1',
        },
        secondary: {
          main: '#f97316',
        },
        background: {
          default: '#070b18',
          paper: '#121329',
        },
        text: {
          primary: '#f8fbff',
          secondary: '#94a3b8',
        },
      },
    },
  },
  cssVariables: {
    colorSchemeSelector: 'class',
  },
  components: {
    MuiContainer: {
      defaultProps: {
        maxWidth: false,
      },
      styleOverrides: {
        root: {
          maxWidth: '100% !important',
          width: '90%',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          border: 'none !important',
          boxShadow: 'none !important',
          fontWeight: 600,
        },
        outlined: {
          border: 'none !important',
          backgroundColor: 'transparent !important',
        },
      },
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
});

export default appTheme;
