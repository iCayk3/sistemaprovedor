import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useThemeMode } from './context';

export function ThemeToggleButton({ sx, ...props }) {
  const { isDark, toggleTheme } = useThemeMode();

  return (
    <Tooltip title={isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro'} arrow>
      <IconButton
        onClick={toggleTheme}
        color="inherit"
        size="small"
        aria-label="alternar tema dark e light"
        sx={{
          p: 1,
          borderRadius: 2,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            bgcolor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 76, 129, 0.08)',
          },
          ...sx,
        }}
        {...props}
      >
        {isDark ? (
          <LightModeIcon sx={{ color: '#facc15', fontSize: '1.35rem' }} />
        ) : (
          <DarkModeIcon sx={{ color: '#0f4c81', fontSize: '1.35rem' }} />
        )}
      </IconButton>
    </Tooltip>
  );
}

export default ThemeToggleButton;
