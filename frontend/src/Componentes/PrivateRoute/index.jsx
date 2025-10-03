// src/Componentes/PrivateRoute.jsx

import { Navigate } from "react-router-dom";
import { useAuth } from "../AuthProvider";

const PrivateRoute = ({ children }) => {
  // O estado 'loading' agora é gerenciado pelo AuthProvider,
  // então só precisamos verificar se o usuário é válido.
  const { valid } = useAuth();

  // Se o usuário não for válido, redireciona para a página de login.
  // O 'replace' evita que o usuário possa voltar para a página anterior no histórico do navegador.
  if (!valid) {
    return <Navigate to="/login" replace />;
  }

  // Se for válido, renderiza o componente filho (no seu caso, o <App />).
  return children;
};

export default PrivateRoute;
