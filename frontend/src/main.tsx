import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter } from 'react-router-dom';
import { getTheme } from './theme/theme';
import { AuthProvider } from './auth/AuthContext';
import App from './App';

function applyCssVars(mode: string, accent: string) {
  const root = document.documentElement;
  root.style.setProperty('--accent-main', accent);
  
  if (mode === 'dark') {
    root.style.setProperty('--surface-canvas', '#0B0F1A');
    root.style.setProperty('--surface-card', '#121728');
    root.style.setProperty('--surface-border', 'rgba(255,255,255,0.08)');
    root.style.setProperty('--surface-border-strong', 'rgba(255,255,255,0.16)');
    root.style.setProperty('--text-primary', '#FFFFFF');
    root.style.setProperty('--text-secondary', '#B8C0D4');
    root.style.setProperty('--text-tertiary', '#6C7A9C');
  } else {
    root.style.setProperty('--surface-canvas', '#F5F6F8');
    root.style.setProperty('--surface-card', '#FFFFFF');
    root.style.setProperty('--surface-border', '#E4E7EC');
    root.style.setProperty('--surface-border-strong', '#D0D5DD');
    root.style.setProperty('--text-primary', '#101828');
    root.style.setProperty('--text-secondary', '#667085');
    root.style.setProperty('--text-tertiary', '#98A2B3');
  }
}

function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [activeTheme, setActiveTheme] = useState(() => {
    let mode = localStorage.getItem('theme_mode') || 'light';
    if (mode === 'system') {
      mode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    let accent = localStorage.getItem('theme_accent') || '#4F7CFF';
    if (accent.startsWith('var(')) accent = '#4F7CFF'; // sanitize corrupted localStorage
    
    applyCssVars(mode, accent);
    return getTheme(mode as 'light' | 'dark', accent);
  });

  useEffect(() => {
    const handler = () => {
      let mode = localStorage.getItem('theme_mode') || 'light';
      if (mode === 'system') {
        mode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      let accent = localStorage.getItem('theme_accent') || '#4F7CFF';
      if (accent.startsWith('var(')) accent = '#4F7CFF';
      
      applyCssVars(mode, accent);
      setActiveTheme(getTheme(mode as 'light' | 'dark', accent));
    };
    
    window.addEventListener('cloudiot_appearance_changed', handler);
    return () => window.removeEventListener('cloudiot_appearance_changed', handler);
  }, []);

  return (
    <ThemeProvider theme={activeTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </AppThemeProvider>
  </React.StrictMode>
);
