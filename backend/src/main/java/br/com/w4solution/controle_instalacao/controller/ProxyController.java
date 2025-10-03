package br.com.w4solution.controle_instalacao.controller;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

/***
 * Deletar
 */
@RestController
@RequestMapping("/proxy")
public class ProxyController {

//    @PostMapping
//    public ResponseEntity<?> proxyRequest(@RequestBody String body, @RequestHeader HttpHeaders headers) {
//        String targetUrl = "https://sistema.solprovedor.com.br/routerbox/ws/rbx_server_json.php";
//
//
//        RestTemplate restTemplate = new RestTemplate();
//
//        HttpHeaders forwardedHeaders = new HttpHeaders();
//        forwardedHeaders.setContentType(MediaType.APPLICATION_JSON);
//
//        // Opcional: repassa o header Authorization se existir
//        if (headers.containsKey("Authorization")) {
//            forwardedHeaders.set("Authorization", headers.getFirst("Authorization"));
//        }
//
//        HttpEntity<String> request = new HttpEntity<>(body, forwardedHeaders);
//
//        try {
//            ResponseEntity<String> response = restTemplate.postForEntity(targetUrl, request, String.class);
//            return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
//        } catch (Exception e) {
//            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body("Erro no proxy: " + e.getMessage());
//        }
//    }
}
