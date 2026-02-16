import { createTheme } from '@mui/material/styles';
import { alpha } from '@mui/material';

const gradients = {
  // Primary (pastel-purple → lavender) – unchanged
  primary: 'linear-gradient(200deg,rgb(137, 94, 210) 0%,rgb(161, 128, 223) 100%)',
  // Secondary (pastel-teal → mint) – unchanged
  secondary: 'linear-gradient(90deg,rgb(35, 177, 163) 0%,rgb(110, 194, 185) 100%)',
  // Header (pastel-purple → pastel-teal → lavender) – unchanged
  header: 'linear-gradient(90deg, #9575CD 0%, #4DB6AC 50%, #B39DDB 100%)',
  // Table header (lavender → pastel-purple) – unchanged
  tableHeader: 'linear-gradient(230deg,rgb(163, 124, 235) 10%, #9575CD 60%)',
  // Accordion collapsed (lavender → pastel-purple) – unchanged
  accordionCollapsed: 'linear-gradient(90deg, #B39DDB 0%, #9575CD 100%)',
  // Accordion expanded (pastel-teal → mint) – unchanged
  accordionExpanded: 'linear-gradient(90deg, #4DB6AC 0%, #80CBC4 100%)',
  // Page background (very light gray → white) – unchanged
  background: 'linear-gradient(180deg, #FAFAFA 0%, #FFFFFF 100%)',
  // Dialog header (lavender → pastel-purple) – unchanged
  dialogHeader: 'linear-gradient(90deg, #9575CD 0%, #B39DDB 100%)',

  // ——— DARKER‐PASTEL VARIANTS FOR BUTTONS ———

  // Warning: deeper pastel amber → soft gold
  warning: 'linear-gradient(90deg, #F57F17 0%, #FFA000 100%)',
  // Error: deep pastel red → mid-pastel rose
  error:   'linear-gradient(90deg, #C62828 0%, #E53935 100%)',
  // Success: deep pastel green → mid-pastel mint
  success: 'linear-gradient(90deg, #2E7D32 0%, #43A047 100%)',
};

const theme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#FAFAFA',
      paper: '#FFFFFF',
    },
    primary: {
      main: 'rgb(114, 59, 209)',      // pastel-purple
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#4DB6AC',      // pastel-teal
      contrastText: '#FFFFFF',
    },
    // DARKER‐PASTEL WARNING / ERROR / SUCCESS:
    warning: {
      main: '#F57F17',      // deeper pastel amber
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#C62828',      // deep pastel red
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#2E7D32',      // deep pastel green
      contrastText: '#FFFFFF',
    },
    text: {
      primary: '#263238',
      secondary: alpha('#263238', 0.7),
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
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          textTransform: 'none',
          padding: '8px 20px',
          fontWeight: 600,
          transition: 'all 0.3s ease',
          // Subtle base shadow on all contained buttons:
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
        },
        containedPrimary: {
          backgroundImage: gradients.primary,
          '&:hover': {
            backgroundPosition: 'right center',
            boxShadow: '0 4px 12px rgba(149, 117, 205, 0.3)', // rgba(#9575CD, 0.3)
          },
        },
        containedSecondary: {
          backgroundImage: gradients.secondary,
          '&:hover': {
            backgroundPosition: 'right center',
            boxShadow: '0 4px 12px rgba(77, 182, 172, 0.3)', // rgba(#4DB6AC, 0.3)
          },
        },

        // —— DARKER‐PASTEL “Warning” BUTTON ——
        containedWarning: {
          backgroundImage: gradients.warning,
          '&:hover': {
            backgroundPosition: 'right center',
            boxShadow: '0 4px 12px rgba(245, 127, 23, 0.3)', // rgba(#F57F17, 0.3)
          },
        },

        // —— DARKER‐PASTEL “Error” BUTTON ——
        containedError: {
          backgroundImage: gradients.error,
          '&:hover': {
            backgroundPosition: 'right center',
            boxShadow: '0 4px 12px rgba(198, 40, 40, 0.3)', // rgba(#C62828, 0.3)
          },
        },

        // —— DARKER‐PASTEL “Success” BUTTON ——
        containedSuccess: {
          backgroundImage: gradients.success,
          '&:hover': {
            backgroundPosition: 'right center',
            boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)', // rgba(#2E7D32, 0.3)
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
              borderColor: alpha('#263238', 0.3),
            },
            '&:hover fieldset': {
              borderColor: '#9575CD',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#9575CD',
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
          color: '#9575CD',
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundImage: gradients.tableHeader,
          color: '#FFFFFF',
          fontWeight: 700,
          padding: '0.3em 0.5em',
        },
        body: {
          padding: '0.3em 0.5em',
          color: '#263238',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:nth-of-type(odd)': {
            backgroundColor: alpha('#9575CD', 0.04),
          },
          '&:hover': {
            backgroundColor: alpha('#9575CD', 0.08),
          },
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
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
            backgroundColor: alpha('#9575CD', 0.1),
          },
          '&.Mui-expanded': {
            backgroundImage: gradients.accordionExpanded,
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
            color: '#263238',
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
          backgroundColor: '#F1F3F5',
          color: '#263238',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          margin: '16px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          transition: 'transform 0.3s ease, opacity 0.3s ease',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          backgroundImage: gradients.dialogHeader,
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
          color: '#263238',
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
          backgroundColor: alpha('#FAFAFA', 0.8),
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: '#FFFFFF',
          '&.dialogClose': {
            position: 'absolute',
            top: 12,
            right: 12,
            backgroundColor: alpha('#263238', 0.2),
            '&:hover': {
              backgroundColor: alpha('#263238', 0.3),
            },
          },
        },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        actions: {
          '& .MuiIconButton-root': {
            color: '#9575CD',
            transition:
              'color 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              color: '#4DB6AC',
              backgroundColor: alpha('#9575CD', 0.15),
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
            },
            '&.Mui-disabled': {
              color: alpha('#263238', 0.3),
            },
          },
        },
      },
    },
  },
});

export default theme;
