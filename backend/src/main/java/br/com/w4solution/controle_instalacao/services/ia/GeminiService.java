package br.com.w4solution.controle_instalacao.services.ia;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.List;
import java.util.Map;

@Service
public class GeminiService {
    private final RestClient restClient;
    private final String apiKey;
    private final String model;
    private final int maxOutputTokens;

    public GeminiService(
            @Value("${ia.gemini.api-key:}") String apiKey,
            @Value("${ia.gemini.base-url:https://generativelanguage.googleapis.com}") String baseUrl,
            @Value("${ia.gemini.model:gemini-3.6-flash}") String model,
            @Value("${ia.gemini.max-output-tokens:4096}") int maxOutputTokens
    ) {
        this.apiKey = apiKey;
        this.model = model;
        this.maxOutputTokens = maxOutputTokens;
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
    }

    public boolean configurado() {
        return apiKey != null && !apiKey.isBlank();
    }

    public String modelo() {
        return model;
    }

    public String responder(String instrucoes, String entrada) {
        if (!configurado()) {
            throw new IllegalStateException(
                    "O Gemini ainda nao foi configurado. Defina GEMINI_API_KEY no backend."
            );
        }

        ResultadoGemini primeiraParte = gerar(instrucoes, entrada);
        if (!primeiraParte.limiteAtingido()) {
            return primeiraParte.texto();
        }

        String pedidoContinuacao = """
                A resposta anterior foi interrompida pelo limite de tokens.
                Continue exatamente do ponto onde parou, sem repetir introducao ou trechos anteriores.
                Conclua de forma objetiva.

                Resposta parcial:
                %s
                """.formatted(primeiraParte.texto());
        ResultadoGemini segundaParte = gerar(instrucoes, entrada + "\n\n" + pedidoContinuacao);
        String textoCompleto = juntarPartes(primeiraParte.texto(), segundaParte.texto());
        if (segundaParte.limiteAtingido()) {
            return textoCompleto + "\n\n> Aviso: a resposta atingiu o limite máximo e pode estar incompleta.";
        }
        return textoCompleto;
    }

    private ResultadoGemini gerar(String instrucoes, String entrada) {
        Map<String, Object> body = Map.of(
                "system_instruction", Map.of(
                        "parts", List.of(Map.of("text", instrucoes))
                ),
                "contents", List.of(Map.of(
                        "role", "user",
                        "parts", List.of(Map.of("text", entrada))
                )),
                "generationConfig", Map.of(
                        "temperature", 0.3,
                        "maxOutputTokens", maxOutputTokens
                )
        );

        try {
            JsonNode response = restClient.post()
                    .uri("/v1beta/models/{model}:generateContent", model)
                    .header("x-goog-api-key", apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);
            return extrairResultado(response);
        } catch (RestClientResponseException exception) {
            throw new IllegalStateException("Falha ao consultar o Gemini (" +
                    exception.getStatusCode().value() + ").", exception);
        }
    }

    private ResultadoGemini extrairResultado(JsonNode response) {
        if (response == null) {
            throw new IllegalStateException("O Gemini retornou uma resposta vazia.");
        }

        StringBuilder texto = new StringBuilder();
        boolean limiteAtingido = false;
        for (JsonNode candidate : response.path("candidates")) {
            if ("MAX_TOKENS".equals(candidate.path("finishReason").asText())) {
                limiteAtingido = true;
            }
            for (JsonNode part : candidate.path("content").path("parts")) {
                if (part.hasNonNull("text")) {
                    texto.append(part.get("text").asText());
                }
            }
        }
        if (!texto.isEmpty()) {
            return new ResultadoGemini(texto.toString(), limiteAtingido);
        }

        String motivo = response.path("promptFeedback").path("blockReason")
                .asText("resposta sem texto");
        throw new IllegalStateException("Nao foi possivel interpretar a resposta do Gemini: " + motivo);
    }

    private String juntarPartes(String primeira, String segunda) {
        return primeira.endsWith("\n") || segunda.startsWith("\n")
                ? primeira + segunda
                : primeira + "\n" + segunda;
    }

    private record ResultadoGemini(String texto, boolean limiteAtingido) {
    }
}
