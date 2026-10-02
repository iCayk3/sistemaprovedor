import { createContext, useContext } from 'react';

export const ThemeModeContext = createContext({
  mode: 'light',
  toggleTheme: () => {},
  setThemeMode: () => {},
  isDark: false,
});

export function useThemeMode() {
  const context = useContext(ThemeModeContext);
  if (!context) {
    throw new Error('useThemeMode deve ser utilizado dentro de um ThemeModeProvider');
  }
  return context;
}
