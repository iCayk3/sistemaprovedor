import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useColorScheme } from '@mui/material/styles';
import { ThemeModeContext } from './context';

const THEME_KEYS = [
  'app-theme-mode',
  'toolpad-mode',
  'toolpad-color-scheme',
  'mui-mode',
  'mui-color-scheme',
];

function getInitialThemeMode() {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = localStorage.getItem('app-theme-mode') 
      || localStorage.getItem('toolpad-mode') 
      || localStorage.getItem('mui-mode');
    if (saved === 'dark' || saved === 'light') return saved;

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch (error) {
    console.warn('Erro ao ler tema inicial do localStorage:', error);
  }
  return 'light';
}

function syncDomWithTheme(mode) {
  if (typeof document === 'undefined') return;
  const isDark = mode === 'dark';
  const root = document.documentElement;

  if (isDark) {
    root.classList.add('dark');
    root.classList.remove('light');
    root.setAttribute('data-toolpad-color-scheme', 'dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
    root.setAttribute('data-toolpad-color-scheme', 'light');
    root.style.colorScheme = 'light';
  }

  try {
    THEME_KEYS.forEach((key) => localStorage.setItem(key, mode));
  } catch (error) {
    console.warn('Erro ao persistir tema no localStorage:', error);
  }
}

export function ThemeModeProvider({ children }) {
  const [mode, setModeState] = useState(getInitialThemeMode);
  const muiColorScheme = useColorScheme();

  const applyThemeMode = useCallback((targetMode) => {
    const nextMode = targetMode === 'dark' ? 'dark' : 'light';
    setModeState(nextMode);
    syncDomWithTheme(nextMode);

    if (muiColorScheme?.setMode) {
      try {
        muiColorScheme.setMode(nextMode);
      } catch {
        // Fallback silencioso caso useColorScheme não esteja ativo
      }
    }
  }, [muiColorScheme]);

  const toggleTheme = useCallback(() => {
    applyThemeMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode, applyThemeMode]);

  useEffect(() => {
    syncDomWithTheme(mode);
  }, [mode]);

  // Se o MUI useColorScheme for alterado por outro componente Toolpad, sincroniza
  useEffect(() => {
    if (muiColorScheme?.mode && muiColorScheme.mode !== 'system' && muiColorScheme.mode !== mode) {
      setModeState(muiColorScheme.mode);
      syncDomWithTheme(muiColorScheme.mode);
    }
  }, [muiColorScheme?.mode, mode]);

  const value = useMemo(() => ({
    mode,
    isDark: mode === 'dark',
    toggleTheme,
    setThemeMode: applyThemeMode,
  }), [mode, toggleTheme, applyThemeMode]);

  return (
    <ThemeModeContext.Provider value={value}>
      {children}
    </ThemeModeContext.Provider>
  );
}

export default ThemeModeProvider;
