const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8080/";

export default function Api() {
    return async (endpoint, method = "GET", body = null) => {
        const headers = {
            "Content-Type": "application/json",
        };

        const options = {
            method,
            credentials: "include",
            headers,
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${apiUrl}${endpoint}`, options);

        if (!response.ok) {
            const errorText = await response.text();
            let message = errorText;

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
