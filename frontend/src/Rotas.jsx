// src/Rotas.jsx

import { BrowserRouter, Route, Routes } from "react-router-dom";
import { createTheme, StyledEngineProvider, ThemeProvider } from "@mui/material";

// Layouts e Páginas
import App from "./App";
import Login from "./Paginas/Login";
import Register from "./Paginas/Register/iindex";

// Componentes de Autenticação e Rota
import { AuthProvider } from "./Componentes/AuthProvider";
import PrivateRoute from "./Componentes/PrivateRoute";
import Passwd from "./Paginas/Passwd";

// Seu tema MUI
const demoTheme = createTheme({
  palette: {
    text: {
      primary: "#000268",
    },
  },
  typography: {
    fontFamily: "'Lato', sans-serif",
    fontSize: 16,
  },
  colorSchemes: { light: true, dark: true },
  cssVariables: {
    colorSchemeSelector: 'class',
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 600,
      lg: 1200,
      xl: 1536,
    },
  },
});

const Rotas = () => {
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={demoTheme}>
        <AuthProvider>
          <BrowserRouter>
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
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  );
};

export default Rotas;
