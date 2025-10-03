// src/Componentes/AuthProvider.jsx

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import Api from "../../Services/Api"; // Verifique se este caminho está correto

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [valid, setValid] = useState(false);
  // Estado para controlar o carregamento da validação inicial
  const [loading, setLoading] = useState(true);

  // Função de logout que será usada em outros componentes
  const logout = useCallback(() => {
    setValid(false);
  }, []);

  useEffect(() => {
    const validarTokenInicial = async () => {
      try {
        await Api()("usuario/token/validar", "GET");
        setValid(true);
      } catch {
        setValid(false);
      } finally {
        // Ao final da primeira validação, o carregamento termina
        setLoading(false);
      }
    };

    validarTokenInicial();

    // Validação periódica para manter a sessão sincronizada
    const interval = setInterval(async () => {
        try {
            await Api()("usuario/token/validar", "GET");
            setValid(true);
        } catch (error) {
            // Se a validação periódica falhar, atualiza o estado
            setValid(false);
        }
    }, 60 * 60 * 1000); // Executa a cada 1 hora

    return () => clearInterval(interval);
  }, []);

  // O valor que será compartilhado com os componentes filhos
  const value = { valid, logout };

  // Enquanto a validação inicial estiver em andamento, exibe uma tela de carregamento.
  // Isso é crucial para evitar que o PrivateRoute seja renderizado com estado inconsistente.
  if (loading) {
    return <div>Carregando...</div>; // Você pode substituir por um componente de Spinner/Loader
  }

  // Só renderiza o aplicativo DEPOIS de saber se o usuário está autenticado ou não
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook customizado para facilitar o uso do contexto
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth deve ser usado dentro de um AuthProvider");
    }
    return context;
};
