// ===================== IMPORTS =====================
import { createTheme } from '@mui/material/styles';
import { alpha } from '@mui/material';

const brand = {
  primary: '#003f2d',
  primaryLight: '#0a5a3f',
  primaryDark: '#00281f',
  secondary: '#d9eadf',
  secondaryLight: '#eff7f2',
  secondaryDark: '#174d37',
  accent: '#0b6b4a',
  accentLight: '#dcefe6',
  accentDark: '#004631',
  sealGold: '#b99a2e',
  warning: '#6f6734',
  warningLight: '#f1efe2',
  warningDark: '#474322',
  surface: '#f4f8f5',
  paper: '#ffffff',
  text: '#0f2a20',
  danger: '#b42318',
  dangerDark: '#7f1d1d',
  success: '#075f3a',
  muted: '#d5e2da',
};

// ===================== GRADIENTS =====================
const gradients = {
  primary: `linear-gradient(90deg, ${brand.primaryDark} 0%, ${brand.primary} 100%)`,
  header: `linear-gradient(180deg, ${brand.primaryDark} 0%, ${brand.primary} 78%, ${brand.accentDark} 100%)`,
  accordionCollapsed: `linear-gradient(90deg, ${brand.primaryDark} 0%, ${brand.primary} 100%)`,
  accordionExpanded: `linear-gradient(90deg, ${brand.primaryDark} 0%, ${brand.primary} 100%)`,
  background: `linear-gradient(180deg, ${brand.surface} 0%, ${brand.paper} 100%)`,
  warning: `linear-gradient(90deg, ${brand.warningDark} 0%, ${brand.warning} 100%)`,
  error: `linear-gradient(90deg, ${brand.danger} 0%, #dc2626 100%)`,
  success: `linear-gradient(90deg, ${brand.success} 0%, #22c55e 100%)`,
};

// ===================== THEME =====================
const theme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: brand.surface,
      paper: brand.paper,
    },
    primary: {
      main: brand.primary,
      light: brand.primaryLight,
      dark: brand.primaryDark,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: brand.secondary,
      light: brand.secondaryLight,
      dark: brand.secondaryDark,
      contrastText: brand.primaryDark,
    },
    warning: {
      main: brand.warning,
      light: brand.warningLight,
      dark: brand.warningDark,
      contrastText: '#FFFFFF',
    },
    error: {
      main: brand.danger,
      dark: brand.dangerDark,
      contrastText: '#FFFFFF',
    },
    success: {
      main: brand.success,
      contrastText: '#FFFFFF',
    },
    text: {
      primary: brand.text,
      secondary: alpha(brand.text, 0.72),
    },
    password: {
      main: brand.muted,
      contrastText: '#FFFFFF',
    },
    view: {
      main: brand.primary,
      contrastText: '#FFFFFF',
    },
    edit: {
      main: brand.accent,
      contrastText: '#FFFFFF',
    },
    delete: {
      main: brand.danger,
      contrastText: '#FFFFFF',
    },
  },
  shape: {
    borderRadius: 5,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        'html, body': {
          background: gradients.background,
          minHeight: '100vh',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: gradients.header,
          boxShadow: `0 4px 12px ${alpha(brand.primaryDark, 0.2)}`,
        },
      },
    },
    MuiButton: {
      defaultProps: {
        tabIndex: -1,
      },
      styleOverrides: {
        root: {
          borderRadius: 20,
          textTransform: 'none',
          padding: '8px 20px',
          fontWeight: 600,
          transition: 'all 0.3s ease',
        },
        containedPrimary: {
          backgroundImage: gradients.primary,
          '&:hover': {
            backgroundPosition: 'right center',
            boxShadow: `0 4px 12px ${alpha(brand.primary, 0.28)}`,
          },
        },
        containedSecondary: {
          backgroundColor: brand.secondary,
          color: brand.primaryDark,
          '&:hover': {
            backgroundColor: brand.secondaryDark,
            color: '#FFFFFF',
            backgroundPosition: 'right center',
            boxShadow: `0 4px 12px ${alpha(brand.primary, 0.18)}`,
          },
        },
        containedWarning: {
          backgroundImage: gradients.warning,
          '&:hover': {
            backgroundPosition: 'right center',
            boxShadow: `0 4px 12px ${alpha(brand.warning, 0.24)}`,
          },
        },
        containedError: {
          backgroundImage: gradients.error,
          '&:hover': {
            filter: 'brightness(1)',
            backgroundPosition: 'right center',
            boxShadow: `0 4px 12px ${alpha(brand.danger, 0.28)}`,
          },
        },
        containedSuccess: {
          backgroundImage: gradients.success,
          '&:hover': {
            backgroundPosition: 'right center',
            boxShadow: `0 4px 12px ${alpha(brand.success, 0.28)}`,
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 16,
            '& fieldset': {
              borderColor: alpha(brand.text, 0.3),
            },
            '&:hover fieldset': {
              borderColor: brand.primary,
            },
            '&.Mui-focused fieldset': {
              borderColor: brand.accent,
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          borderRadius: 16,
        },
        icon: {
          color: brand.primary,
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          boxShadow: `0 4px 16px ${alpha(brand.primaryDark, 0.08)}`,
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 220px)',
          overflow: 'hidden',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: brand.primary,
          color: '#FFFFFF',
          fontWeight: 700,
          padding: '0.3em 0.5em',
          position: 'sticky',
          top: 0,
          zIndex: 2,
        },
        body: {
          padding: '0.3em 0.5em',
          color: brand.text,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:nth-of-type(odd)': {
            backgroundColor: alpha(brand.primary, 0.04),
          },
          '&:hover': {
            backgroundColor: alpha(brand.primary, 0.07),
          },
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          boxShadow: `0 2px 12px ${alpha(brand.primaryDark, 0.08)}`,
          '&:before': {
            display: 'none',
          },
          margin: '0.4em',
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          padding: '0 16px',
          transition: 'background 0.3s ease',
          backgroundImage: gradients.accordionCollapsed,
          '&:hover': {
            backgroundColor: alpha(brand.primary, 0.1),
          },
          '&.Mui-expanded': {
            backgroundImage: gradients.accordionExpanded,
            color: '#FFFFFF',
          },
        },
        title: {
          color: '#FFFFFF',
        },
        expandIconWrapper: {
          color: '#FFFFFF',
          transition: 'transform 0.3s ease, color 0.3s ease',
          '&.Mui-expanded': {
            transform: 'rotate(180deg)',
            color: '#FFFFFF',
          },
        },
        content: {
          '&.Mui-expanded': {
            margin: '12px 0',
          },
        },
      },
    },
    MuiAccordionDetails: {
      styleOverrides: {
        root: {
          padding: '16px',
          backgroundColor: '#f1f5f9',
          color: brand.text,
        },
      },
    },
    MuiDialog: {
      defaultProps: {
        fullWidth: true,
        maxWidth: 'xs',
      },
      styleOverrides: {
        paper: {
          borderRadius: 12,
          margin: '16px',
          boxShadow: `0 8px 24px ${alpha(brand.primaryDark, 0.14)}`,
          overflow: 'hidden',
          transition: 'transform 0.3s ease, opacity 0.3s ease',
          border: `1px solid ${alpha(brand.primary, 0.12)}`,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          color: '#FFFFFF',
          padding: '16px 24px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '24px',
          color: brand.text,
          '&:first-of-type': {
            paddingTop: '20px',
          },
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
          gap: '12px',
          backgroundColor: alpha(brand.surface, 0.8),
          flexWrap: 'wrap',
          '& .MuiButton-root': {
            minWidth: 120,
          },
          '@media (max-width: 600px)': {
            padding: '14px 16px 18px',
            '& .MuiButton-root': {
              flex: '1 1 100%',
            },
          },
        },
      },
    },
    MuiIconButton: {
      defaultProps: {
        tabIndex: -1,
      },
      styleOverrides: {
        root: {
          color: '#FFFFFF',
          '&:hover': {
            filter: 'brightness(0.8)',
          },
          '&.MuiIconButton-colorPassword': {
            backgroundColor: brand.muted,
          },
          '&.MuiIconButton-colorView': {
            backgroundColor: brand.primary,
          },
          '&.MuiIconButton-colorEdit': {
            backgroundColor: brand.accent,
          },
          '&.MuiIconButton-colorDelete': {
            backgroundColor: brand.danger,
            '&:hover': {
              backgroundColor: brand.dangerDark,
              filter: 'none',
            },
          },
          '&.dialogClose': {
            position: 'absolute',
            top: 12,
            right: 12,
            backgroundColor: alpha(brand.text, 0.2),
            '&:hover': {
              backgroundColor: alpha(brand.text, 0.3),
            },
          },
        },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        toolbar: {
          minHeight: 42,
          paddingLeft: 8,
          paddingRight: 8,
        },
        actions: {
          '& .MuiIconButton-root': {
            width: 28,
            height: 28,
            padding: 0,
            borderRadius: 20,
            color: '#FFFFFF',
            backgroundColor: brand.primary,
            transition: 'color 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              color: '#FFFFFF',
              backgroundColor: brand.primaryDark,
              boxShadow: `0 2px 6px ${alpha(brand.primaryDark, 0.18)}`,
            },
            '&.Mui-disabled': {
              color: alpha('#FFFFFF', 0.7),
              backgroundColor: alpha(brand.primary, 0.35),
            },
            '& .MuiSvgIcon-root': {
              fontSize: '1rem',
            },
          },
        },
      },
    },
  },
});

export default theme;
