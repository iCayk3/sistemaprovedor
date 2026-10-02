const apiUrl = import.meta.env.VITE_API_URL
    ?? `${window.location.protocol}//${window.location.hostname}:8080/`;

function buildUrl(base, endpoint) {
    const cleanBase = (base || "").replace(/\/+$/, "");
    const cleanEndpoint = (endpoint || "").replace(/^\/+/, "");
    return `${cleanBase}/${cleanEndpoint}`;
}

let refreshPromise = null;

/**
 * Executa a renovação silenciosa do token JWT HttpOnly com fila única (mutex)
 * para evitar múltiplos requests concorrentes de refresh.
 */
export async function silentRefreshToken() {
    if (!refreshPromise) {
        refreshPromise = (async () => {
            try {
                const response = await fetch(buildUrl(apiUrl, 'usuario/token/refresh'), {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (!response.ok) {
                    return false;
                }

                const data = await response.json();
                if (data?.usuario) {
                    localStorage.setItem('user', JSON.stringify(data.usuario));
                }
                return true;
            } catch (err) {
                console.warn('Falha no silent refresh:', err);
                return false;
            } finally {
                refreshPromise = null;
            }
        })();
    }
    return refreshPromise;
}

export default function Api() {
    return async (endpoint, method = "GET", body = null) => {
        const isFormData = body instanceof FormData;
        const headers = isFormData ? {} : { "Content-Type": "application/json" };

        const options = {
            method,
            credentials: "include",
            headers,
            cache: method === "GET" ? "no-store" : "default",
        };

        if (body) options.body = isFormData ? body : JSON.stringify(body);

        let response = await fetch(buildUrl(apiUrl, endpoint), options);

        if (!response.ok) {
            const currentPath = window.location.pathname;
            const isAuthRoute = ['/login', '/register', '/forgotpass'].includes(currentPath);
            const isAuthEndpoint = endpoint.includes('usuario/token/validar')
                || endpoint.includes('usuario/logar')
                || endpoint.includes('usuario/token/refresh');

            // Interceptador reativo de 401 com renovação silenciosa transparente
            if (response.status === 401 && !isAuthRoute && !isAuthEndpoint) {
                const refreshed = await silentRefreshToken();
                if (refreshed) {
                    // Repete a requisição original com o novo token válido
                    response = await fetch(buildUrl(apiUrl, endpoint), options);
                } else {
                    localStorage.removeItem('user');
                    sessionStorage.clear();
                    window.location.href = '/login';
                }
            } else if (response.status === 401 && !isAuthRoute && endpoint.includes('usuario/token/validar')) {
                const refreshed = await silentRefreshToken();
                if (refreshed) {
                    return { ok: true };
                }
            }

            if (!response.ok) {
                if (response.status === 401 && !isAuthRoute && !isAuthEndpoint) {
                    localStorage.removeItem('user');
                    sessionStorage.clear();
                    window.location.href = '/login';
                }

                const errorText = await response.text();
                let message = response.status === 413
                    ? "O arquivo excede o limite permitido de 20 MB."
                    : errorText;

                try {
                    const parsed = JSON.parse(errorText);
                    if (Array.isArray(parsed)) {
                        message = parsed.map((item) => item.mensagem || item.message || JSON.stringify(item)).join("; ");
                    } else if (parsed?.message || parsed?.erro || parsed?.error) {
                        message = parsed.message || parsed.erro || parsed.error;
                    }
                } catch {
                    message = errorText;
                }

                const error = new Error(message || "Erro na requisicao");
                error.status = response.status;
                throw error;
            }
        }

        const contentType = response.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
            return await response.json();
        }

        return await response.text();
    };
}
