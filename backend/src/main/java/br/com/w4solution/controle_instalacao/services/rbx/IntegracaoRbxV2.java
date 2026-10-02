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
public class IntegracaoRbxV2 {
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final String url;
    private final String chaveApi;

    public IntegracaoRbxV2(
            @Value("${api.service.integration.rbx.v2:}") String v2Url,
            @Value("${api.service.integration.rbx}") String v1Url,
            @Value("${api.service.integration.rbx.chave}") String chaveApi
    ) {
        this.objectMapper = new ObjectMapper();
        this.chaveApi = chaveApi;

        if (v2Url != null && !v2Url.isBlank()) {
            this.url = v2Url;
        } else {
            // Deriva URL v2 a partir da URL v1 (ex: https://dominio/routerbox/ws_json/ws_json.php)
            String base = v1Url.replaceAll("/routerbox/.*", "");
            this.url = base + "/routerbox/ws_json/ws_json.php";
        }

        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(15000);
        // Timeout de leitura de 240 segundos devido ao volume da tabela radacct no RBX
        factory.setReadTimeout(240000);
        this.restTemplate = new RestTemplate(factory);
    }

    public <T> List<T> fazerRequest(String body, TypeReference<RespostaAPI<T>> typeReference) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("authentication_key", chaveApi);

        HttpEntity<String> request = new HttpEntity<>(body, headers);

        String responseBody;
        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new RuntimeException("Falha na requisição RBX v2: status " + response.getStatusCode());
            }
            responseBody = response.getBody();
        } catch (HttpStatusCodeException ex) {
            String errorBody = ex.getResponseBodyAsString();
            if (isConsultaSemResultados(errorBody)) {
                return Collections.emptyList();
            }
            throw new RuntimeException("Falha na requisição RBX v2 (" + ex.getStatusCode() + "): " + errorBody, ex);
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
                || body.contains("\"error_code\":1")
                || body.contains("\"error_code\":\"1\"");
    }
}
