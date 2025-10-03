package br.com.w4solution.controle_instalacao.services.rbx;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Component
public class IntegracaoRbx {
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    @Value("${api.service.integration.rbx}")
    private String url;

    public <T> List<T> fazerRequest(String body, TypeReference<RespostaAPI<T>> typeReference) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> request = new HttpEntity<>(body, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            RespostaAPI<T> resposta = objectMapper.readValue(response.getBody(), typeReference);
            return resposta.getResult();
        } else {
            throw new RuntimeException("Falha na requisição: " + response.getStatusCode());
        }
    }
}
