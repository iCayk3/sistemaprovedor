const apiUrl = import.meta.env.VITE_API_URL
    ?? `${window.location.protocol}//${window.location.hostname}:8080/`;

function buildUrl(base, endpoint) {
    const cleanBase = (base || "").replace(/\/+$/, "");
    const cleanEndpoint = (endpoint || "").replace(/^\/+/, "");
    return `${cleanBase}/${cleanEndpoint}`;
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

        const response = await fetch(buildUrl(apiUrl, endpoint), options);

        if (!response.ok) {
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

        const contentType = response.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
            return await response.json();
        }

        return await response.text();
    };
}
