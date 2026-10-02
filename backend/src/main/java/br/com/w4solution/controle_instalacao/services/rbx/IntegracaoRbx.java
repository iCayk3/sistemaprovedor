package br.com.w4solution.controle_instalacao.services.rbx;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;

@Component
public class IntegracaoRbx {
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final String url;

    public IntegracaoRbx(@Value("${api.service.integration.rbx}") String url) {
        this.url = url;
        this.objectMapper = new ObjectMapper();

        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000);
        factory.setReadTimeout(30000);
        this.restTemplate = new RestTemplate(factory);
    }

    public <T> List<T> fazerRequest(String body, TypeReference<RespostaAPI<T>> typeReference) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> request = new HttpEntity<>(body, headers);

        String responseBody;
        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new RuntimeException("Falha na requisição RBX: status " + response.getStatusCode());
            }
            responseBody = response.getBody();
        } catch (HttpStatusCodeException ex) {
            String errorBody = ex.getResponseBodyAsString();
            if (ex.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                // No RBX, o código 401 é retornado quando "A consulta nao retornou resultados"
                if (errorBody.isBlank() || isConsultaSemResultados(errorBody)) {
                    return Collections.emptyList();
                }
            }
            if (isConsultaSemResultados(errorBody)) {
                return Collections.emptyList();
            }
            throw new RuntimeException("Falha na requisição RBX (" + ex.getStatusCode() + "): " + errorBody, ex);
        }

        if (isConsultaSemResultados(responseBody)) {
            return Collections.emptyList();
        }

        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode resultNode = root.get("result");
        if (resultNode == null || resultNode.isNull() || (resultNode.isTextual() && resultNode.asText().isBlank())) {
            return Collections.emptyList();
        }

        RespostaAPI<T> resposta = objectMapper.readValue(responseBody, typeReference);
        return resposta.getResult() != null ? resposta.getResult() : Collections.emptyList();
    }

    private boolean isConsultaSemResultados(String body) {
        if (body == null || body.isBlank()) {
            return false;
        }
        return body.contains("A consulta nao retornou resultados")
                || body.contains("\"erro_code\":1")
                || body.contains("\"erro_code\":\"1\"");
    }
}

