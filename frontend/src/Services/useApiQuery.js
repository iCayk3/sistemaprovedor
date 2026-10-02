import { useQuery } from '@tanstack/react-query';
import Api from './Api';

const defaultApi = Api();

/**
 * Hook utilitário para consultas otimizadas com cache TanStack Query
 * 
 * @param {Array|string} queryKey - Chave identificadora no cache
 * @param {string} endpoint - Rota do backend (ex: 'rbx/boletosabertos')
 * @param {string} [method='GET'] - Método HTTP (GET, POST, etc.)
 * @param {any} [body=null] - Payload de envio se aplicável
 * @param {Object} [options={}] - Opções nativas do TanStack useQuery
 */
export function useApiQuery(queryKey, endpoint, method = 'GET', body = null, options = {}) {
  const key = Array.isArray(queryKey) ? queryKey : [queryKey || endpoint];

  return useQuery({
    queryKey: key,
    queryFn: () => defaultApi(endpoint, method, body),
    enabled: Boolean(endpoint) && options.enabled !== false,
    ...options,
  });
}

export default useApiQuery;
