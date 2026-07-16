import { createTheme } from '@mui/material/styles';

/**
 * CloudIoT design tokens
 * -----------------------
 * Sidebar:   deep navy-charcoal, not pure black — reads as "control room," not "marketing site"
 * Content:   cool off-white, high-legibility for dense data
 * Accent:    signal blue — reserved for live/active state, never decorative
 * Status:    a distinct hue per device/alert state, consistent everywhere they appear
 *
 * Type: Plus Jakarta Sans for headings/nav (a little more geometric character than Inter alone),
 * Inter for body/UI text, IBM Plex Mono for IDs, IPs, firmware hashes, and telemetry values —
 * monospaced data reads as "real system," not a template.
 */

export const tokens = {
  sidebar: {
    bg: '#0B0F1A',
    bgElevated: '#121728',
    border: 'rgba(255,255,255,0.08)',
    text: '#B8C0D4',
    textActive: '#FFFFFF',
    activeBg: 'rgba(79,124,255,0.16)',
  },
  accent: {
    main: 'var(--accent-main, #4F7CFF)',
    dark: 'var(--accent-dark, #3557D6)',
    light: 'var(--accent-light, #7C9CFF)',
  },
  status: {
    online: '#12B76A',
    offline: '#98A2B3',
    warning: '#F79009',
    critical: '#F04438',
    info: '#4F7CFF',
  },
  surface: {
    canvas: 'var(--surface-canvas, #F5F6F8)',
    card: 'var(--surface-card, #FFFFFF)',
    border: 'var(--surface-border, #E4E7EC)',
    borderStrong: 'var(--surface-border-strong, #D0D5DD)',
  },
  text: {
    primary: 'var(--text-primary, #101828)',
    secondary: 'var(--text-secondary, #667085)',
    tertiary: 'var(--text-tertiary, #98A2B3)',
  },
};

export const getTheme = (mode: 'light' | 'dark' = 'light', accent: string = '#4F7CFF') => createTheme({
  palette: {
    mode,
    primary: { main: accent },
    background: { default: mode === 'dark' ? '#0B0F1A' : '#F5F6F8', paper: mode === 'dark' ? '#121728' : '#FFFFFF' },
    text: { primary: mode === 'dark' ? '#FFFFFF' : '#101828', secondary: mode === 'dark' ? '#B8C0D4' : '#667085' },
    success: { main: tokens.status.online },
    warning: { main: tokens.status.warning },
    error: { main: tokens.status.critical },
    info: { main: tokens.status.info },
    divider: mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#E4E7EC',
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    h1: { fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700 },
    h2: { fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700 },
    h3: { fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700 },
    h4: { fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '1.5rem' },
    h5: { fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600, fontSize: '1.125rem' },
    h6: { fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600, fontSize: '1rem' },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600, fontSize: '0.8125rem', color: tokens.text.secondary },
    body2: { fontSize: '0.875rem' },
    caption: { fontSize: '0.75rem', color: tokens.text.tertiary },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: tokens.surface.canvas },
        '::-webkit-scrollbar': { width: 8, height: 8 },
        '::-webkit-scrollbar-thumb': { backgroundColor: '#D0D5DD', borderRadius: 8 },
        '::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, boxShadow: 'none' },
        contained: { boxShadow: 'none', '&:hover': { boxShadow: 'none' } },
      },
      defaultProps: { disableElevation: true },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: `1px solid ${tokens.surface.border}`,
        },
      },
      defaultProps: { elevation: 0 },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: `1px solid ${tokens.surface.border}`,
          boxShadow: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 600 } },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontSize: '0.75rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          color: tokens.text.tertiary,
          backgroundColor: mode === 'dark' ? '#121728' : '#FAFBFC',
        },
      },
    },
  },
});

export const theme = getTheme('light', '#4F7CFF');
