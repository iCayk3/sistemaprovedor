// src/Rotas.jsx

import React, { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Box, CircularProgress, StyledEngineProvider, ThemeProvider } from "@mui/material";

// Layouts e Páginas Lazy-loaded para Code Splitting
const App = lazy(() => import("./App"));
const Login = lazy(() => import("./Paginas/Login"));
const Register = lazy(() => import("./Paginas/Register"));
const Passwd = lazy(() => import("./Paginas/Passwd"));

// Componentes de Autenticação, Tema e Rota
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./Services/queryClient";
import { AuthProvider } from "./Componentes/AuthProvider";
import { NotificationProvider } from "./Componentes/NotificationProvider";
import { ThemeModeProvider } from "./Componentes/ThemeModeProvider";
import PrivateRoute from "./Componentes/PrivateRoute";
import { appTheme } from "./Utils/appTheme";

const LoadingFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
    <CircularProgress />
  </Box>
);

const Rotas = () => {
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider
        theme={appTheme}
        modeStorageKey="toolpad-mode"
        colorSchemeStorageKey="toolpad-color-scheme"
      >
        <ThemeModeProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <NotificationProvider>
                <BrowserRouter>
                  <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                      {/* GRUPO DE ROTAS PÚBLICAS: /login e /register */}
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/forgotpass" element={<Passwd />} />

                      {/* GRUPO DE ROTAS PRIVADAS: Qualquer outra rota é capturada aqui */}
                      <Route
                        path="/*" 
                        element={
                          <PrivateRoute>
                            <App />
                          </PrivateRoute>
                        }
                      />
                    </Routes>
                  </Suspense>
                </BrowserRouter>
              </NotificationProvider>
            </AuthProvider>
          </QueryClientProvider>
        </ThemeModeProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  );
};

export default Rotas;
