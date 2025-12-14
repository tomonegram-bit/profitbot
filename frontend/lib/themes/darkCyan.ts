import { createTheme } from '@mui/material/styles';

export const darkCyanTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00E5FF', // Vibrant cyan for CTAs
      light: '#80DEEA',
      dark: '#00838F',
      contrastText: '#0A1A1F',
    },
    secondary: {
      main: '#1A5D6B', // Muted teal
      light: '#2E7D87',
      dark: '#0D2B2F',
      contrastText: '#E0F7FA',
    },
    background: {
      default: '#0A1A1F', // Deep charcoal/near black
      paper: '#0D2B2F',   // Dark cyan/teal
    },
    text: {
      primary: '#E0F7FA', // Off-white with cyan tint
      secondary: '#B2EBF2', // Light cyan
      disabled: '#78909C',  // Grayish cyan
    },
    divider: 'rgba(0, 229, 255, 0.2)',
    action: {
      active: '#00E5FF',
      hover: 'rgba(0, 229, 255, 0.1)',
      selected: 'rgba(0, 229, 255, 0.2)',
      disabled: 'rgba(120, 144, 156, 0.3)',
      disabledBackground: 'rgba(120, 144, 156, 0.12)',
    },
    success: {
      main: '#00C853',
      light: '#69F0AE',
      dark: '#009624',
    },
    warning: {
      main: '#FF6D00',
      light: '#FFAB40',
      dark: '#DD2C00',
    },
    error: {
      main: '#FF5252',
      light: '#FF8A80',
      dark: '#D32F2F',
    },
    info: {
      main: '#00B8D4',
      light: '#4DD0E1',
      dark: '#0097A7',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 500,
      fontSize: '2.5rem',
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
      color: '#E0F7FA',
    },
    h2: {
      fontWeight: 500,
      fontSize: '2rem',
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
      color: '#E0F7FA',
    },
    h3: {
      fontWeight: 500,
      fontSize: '1.75rem',
      lineHeight: 1.4,
      color: '#E0F7FA',
    },
    h4: {
      fontWeight: 500,
      fontSize: '1.5rem',
      lineHeight: 1.4,
      color: '#E0F7FA',
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.25rem',
      lineHeight: 1.5,
      color: '#E0F7FA',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem',
      lineHeight: 1.6,
      color: '#E0F7FA',
    },
    body1: {
      fontWeight: 400,
      fontSize: '1rem',
      lineHeight: 1.6,
      color: '#E0F7FA',
    },
    body2: {
      fontWeight: 400,
      fontSize: '0.875rem',
      lineHeight: 1.6,
      color: '#B2EBF2',
    },
    button: {
      fontWeight: 600,
      fontSize: '0.875rem',
      lineHeight: 1.75,
      textTransform: 'none',
      letterSpacing: '0.02em',
    },
    caption: {
      fontWeight: 400,
      fontSize: '0.75rem',
      lineHeight: 1.66,
      color: '#78909C',
    },
    overline: {
      fontWeight: 600,
      fontSize: '0.75rem',
      lineHeight: 1.66,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: '#B2EBF2',
    },
    // monospace style intentionally omitted to satisfy MUI typings
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '@import': [
          'url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Roboto+Mono:wght@300;400;500&display=swap")',
        ],
        body: {
          scrollbarWidth: 'thin',
          scrollbarColor: '#1A5D6B #0A1A1F',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#0A1A1F',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#1A5D6B',
            borderRadius: '4px',
            border: '2px solid #0A1A1F',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: '#2E7D87',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.875rem',
          lineHeight: 1.75,
          letterSpacing: '0.02em',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 229, 255, 0.3)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          },
          '&.Mui-disabled': {
            boxShadow: 'none',
            backgroundColor: 'rgba(120, 144, 156, 0.2)',
            color: '#78909C',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #00B8D4 0%, #00838F 100%)',
          color: '#0A1A1F',
          '&:hover': {
            background: 'linear-gradient(135deg, #00E5FF 0%, #00B8D4 100%)',
          },
        },
        outlined: {
          borderColor: 'rgba(0, 229, 255, 0.5)',
          color: '#00E5FF',
          '&:hover': {
            borderColor: '#00E5FF',
            backgroundColor: 'rgba(0, 229, 255, 0.1)',
          },
        },
        text: {
          color: '#00E5FF',
          '&:hover': {
            backgroundColor: 'rgba(0, 229, 255, 0.1)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(13, 43, 47, 0.8)',
          backgroundImage: 'none',
          border: '1px solid rgba(0, 229, 255, 0.2)',
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0, 229, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 8px 30px rgba(0, 229, 255, 0.15)',
            borderColor: 'rgba(0, 229, 255, 0.3)',
          },
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(0, 229, 255, 0.1)',
        },
        elevation2: {
          boxShadow: '0 4px 12px rgba(0, 229, 255, 0.12)',
        },
        elevation3: {
          boxShadow: '0 8px 24px rgba(0, 229, 255, 0.15)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(13, 43, 47, 0.8)',
          border: '1px solid rgba(0, 229, 255, 0.2)',
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0, 229, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 8px 30px rgba(0, 229, 255, 0.15)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(13, 43, 47, 0.6)',
          border: '1px solid rgba(0, 229, 255, 0.3)',
          borderRadius: 8,
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: 'rgba(0, 229, 255, 0.5)',
            backgroundColor: 'rgba(13, 43, 47, 0.8)',
          },
          '&.Mui-focused': {
            borderColor: '#00E5FF',
            backgroundColor: 'rgba(13, 43, 47, 0.9)',
            boxShadow: '0 0 0 3px rgba(0, 229, 255, 0.2)',
          },
          '&.Mui-error': {
            borderColor: '#FF5252',
          },
          '&.Mui-disabled': {
            backgroundColor: 'rgba(120, 144, 156, 0.1)',
            borderColor: 'rgba(120, 144, 156, 0.3)',
          },
        },
        input: {
          color: '#E0F7FA',
          '&::placeholder': {
            color: '#78909C',
            opacity: 1,
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        notchedOutline: {
          borderColor: 'rgba(0, 229, 255, 0.3)',
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          color: '#B2EBF2',
          '&.Mui-focused': {
            color: '#00E5FF',
          },
          '&.Mui-error': {
            color: '#FF5252',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(26, 93, 107, 0.3)',
          border: '1px solid rgba(0, 229, 255, 0.3)',
          color: '#B2EBF2',
          fontWeight: 500,
        },
        filled: {
          backgroundColor: 'rgba(0, 229, 255, 0.1)',
          color: '#00E5FF',
        },
        outlined: {
          borderColor: 'rgba(0, 229, 255, 0.5)',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: '#B2EBF2',
          '&:hover': {
            backgroundColor: 'rgba(0, 229, 255, 0.1)',
            color: '#00E5FF',
          },
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(0, 229, 255, 0.05)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(0, 229, 255, 0.1)',
            '&:hover': {
              backgroundColor: 'rgba(0, 229, 255, 0.15)',
            },
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: 'rgba(13, 43, 47, 0.95)',
          border: '1px solid rgba(0, 229, 255, 0.3)',
          borderRadius: 8,
          boxShadow: '0 8px 32px rgba(0, 229, 255, 0.2)',
          backdropFilter: 'blur(10px)',
        },
      },
    },
    MuiModal: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(4px)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: 'rgba(13, 43, 47, 0.95)',
          border: '1px solid rgba(0, 229, 255, 0.3)',
          borderRadius: 12,
          boxShadow: '0 20px 60px rgba(0, 229, 255, 0.3)',
          backdropFilter: 'blur(20px)',
        },
      },
    },
    // MuiDataGrid styles omitted (from @mui/x-data-grid, not core theme)
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: 'rgba(13, 43, 47, 0.95)',
          color: '#E0F7FA',
          border: '1px solid rgba(0, 229, 255, 0.3)',
          borderRadius: 8,
          fontSize: '0.875rem',
          backdropFilter: 'blur(10px)',
        },
        arrow: {
          color: 'rgba(13, 43, 47, 0.95)',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          border: '1px solid',
        },
        standardSuccess: {
          backgroundColor: 'rgba(0, 200, 83, 0.1)',
          borderColor: 'rgba(0, 200, 83, 0.3)',
          color: '#E0F7FA',
        },
        standardWarning: {
          backgroundColor: 'rgba(255, 109, 0, 0.1)',
          borderColor: 'rgba(255, 109, 0, 0.3)',
          color: '#E0F7FA',
        },
        standardError: {
          backgroundColor: 'rgba(255, 82, 82, 0.1)',
          borderColor: 'rgba(255, 82, 82, 0.3)',
          color: '#E0F7FA',
        },
        standardInfo: {
          backgroundColor: 'rgba(0, 184, 212, 0.1)',
          borderColor: 'rgba(0, 184, 212, 0.3)',
          color: '#E0F7FA',
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
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },
});

export default darkCyanTheme;