const apiUrl = "http://localhost:8080/";

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
            const error = new Error(errorText || "Erro na requisição");
            error.status = response.status;
            throw error;
        }

        const contentType = response.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
            return await response.json();
        } else {
            return await response.text();
        }
    };
}
