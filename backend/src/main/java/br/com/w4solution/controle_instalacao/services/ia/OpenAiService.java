package br.com.w4solution.controle_instalacao.services.ia;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.Map;

@Service
public class OpenAiService {
    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String model;

    public OpenAiService(
            ObjectMapper objectMapper,
            @Value("${ia.openai.api-key:}") String apiKey,
            @Value("${ia.openai.base-url:https://api.openai.com/v1}") String baseUrl,
            @Value("${ia.openai.model:gpt-5.6-luna}") String model
    ) {
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.model = model;
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
                    "A IA ainda nao foi configurada. Defina a variavel OPENAI_API_KEY no backend."
            );
        }

        Map<String, Object> body = Map.of(
                "model", model,
                "instructions", instrucoes,
                "input", entrada,
                "store", false,
                "text", Map.of("verbosity", "low"),
                "reasoning", Map.of("effort", "low")
        );

        try {
            JsonNode response = restClient.post()
                    .uri("/responses")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);
            return extrairTexto(response);
        } catch (RestClientResponseException exception) {
            throw new IllegalStateException("Falha ao consultar o servico de IA (" +
                    exception.getStatusCode().value() + ").", exception);
        }
    }

    private String extrairTexto(JsonNode response) {
        if (response == null) {
            throw new IllegalStateException("O servico de IA retornou uma resposta vazia.");
        }
        if (response.hasNonNull("output_text")) {
            return response.get("output_text").asText();
        }
        for (JsonNode output : response.path("output")) {
            for (JsonNode content : output.path("content")) {
                if ("output_text".equals(content.path("type").asText()) && content.hasNonNull("text")) {
                    return content.get("text").asText();
                }
            }
        }
        throw new IllegalStateException("Nao foi possivel interpretar a resposta da IA: " +
                objectMapper.convertValue(response.path("status"), String.class));
    }
}
