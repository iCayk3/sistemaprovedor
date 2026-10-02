import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Box, CircularProgress } from '@mui/material';
import Api, { silentRefreshToken } from '../../Services/Api';
import { AuthContext } from './context';

const SILENT_REFRESH_INTERVAL = 15 * 60 * 1000; // Renovação proativa a cada 15 minutos

export const AuthProvider = ({ children }) => {
  const [valid, setValid] = useState(false);
  const [loading, setLoading] = useState(true);

  const login = useCallback(() => {
    setValid(true);
  }, []);

  const logout = useCallback(() => {
    setValid(false);
  }, []);

  // Validação inicial ao carregar a página
  useEffect(() => {
    let ativo = true;

    const validarTokenInicial = async () => {
      try {
        await Api()('usuario/token/validar', 'GET');
        if (ativo) setValid(true);
      } catch {
        // Se a validação direta falhar (ex: token expirou na última hora),
        // tenta o silent refresh com a janela de tolerância de 24h
        const refreshed = await silentRefreshToken();
        if (ativo) setValid(refreshed);
      } finally {
        if (ativo) setLoading(false);
      }
    };

    validarTokenInicial();

    return () => {
      ativo = false;
    };
  }, []);

  // Renovação periódica silenciosa em segundo plano enquanto autenticado
  useEffect(() => {
    if (!valid) return undefined;

    let ultimaRenovacao = Date.now();

    const executarRenovacaoPeriodica = async () => {
      try {
        const ok = await silentRefreshToken();
        if (ok) {
          ultimaRenovacao = Date.now();
        } else {
          setValid(false);
        }
      } catch {
        // Falha silenciosa: o interceptador na camada de API cuidará de requisições futuras
      }
    };

    const interval = setInterval(executarRenovacaoPeriodica, SILENT_REFRESH_INTERVAL);

    // Quando o operador retorna à aba do sistema, verifica se precisa renovar imediatamente
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && Date.now() - ultimaRenovacao > SILENT_REFRESH_INTERVAL) {
        executarRenovacaoPeriodica();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [valid]);

  const value = useMemo(() => ({ valid, login, logout }), [valid, login, logout]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'background.default' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
