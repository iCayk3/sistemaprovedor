import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutos: dados permanecem frescos sem novo request
      gcTime: 1000 * 60 * 10,   // 10 minutos: tempo mantido em cache inativo na memória
      refetchOnWindowFocus: false, // evita refetch abrupto enquanto o operador está na tela
      refetchOnReconnect: true,  // revalida caso a conexão com a rede caia e retorne
      retry: 1,                 // tenta novamente 1 vez em caso de oscilação momentânea
    },
  },
});
