package br.com.w4solution.controle_instalacao.services.rbx;

import br.com.w4solution.controle_instalacao.dto.rbx.AtendimentoAberturaRbxDTO;
import br.com.w4solution.controle_instalacao.dto.rbx.AtendimentoEncerramentoRbxDTO;
import br.com.w4solution.controle_instalacao.dto.rbx.AtendimentoRbxResultadoDTO;
import br.com.w4solution.controle_instalacao.services.usuarios.UsuarioService.CredenciaisRbx;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.format.DateTimeFormatter;

@Component
public class RbxAtendimentoClient {
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper;
    private final String urlV1;
    private final String urlV2;
    private final boolean escritaHabilitada;

    public RbxAtendimentoClient(ObjectMapper objectMapper,
                                @Value("${api.service.integration.rbx}") String urlV1,
                                @Value("${api.service.integration.rbx.v2:}") String urlV2,
                                @Value("${api.service.integration.rbx.atendimentos.escrita-habilitada:false}") boolean escritaHabilitada) {
        this.objectMapper = objectMapper;
        this.urlV1 = urlV1;
        this.urlV2 = urlV2 == null || urlV2.isBlank() ? derivarUrlV2(urlV1) : urlV2;
        this.escritaHabilitada = escritaHabilitada;
    }

    public AtendimentoRbxResultadoDTO abrir(AtendimentoAberturaRbxDTO dados, CredenciaisRbx credenciais) {
        validarEscritaAutorizada();
        return executarAbertura(dados, credenciais);
    }

    private AtendimentoRbxResultadoDTO executarAbertura(AtendimentoAberturaRbxDTO dados, CredenciaisRbx credenciais) {
        validarAbertura(dados, credenciais);
        ObjectNode atendimento = objectMapper.createObjectNode();
        atendimento.put("Data_Abertura", dados.dataAbertura().toString());
        atendimento.put("Hora_Abertura", dados.horaAbertura().format(DateTimeFormatter.ofPattern("HH:mm:ss")));
        atendimento.put("Iniciativa", dados.iniciativa());
        atendimento.put("Modo", dados.modo());
        atendimento.put("TipoCliente", dados.tipoCliente());
        atendimento.put("Cliente", dados.cliente());
        put(atendimento, "Contrato", dados.contrato());
        put(atendimento, "Contato", dados.contato());
        put(atendimento, "Prioridade", dados.prioridade());
        put(atendimento, "Situacao", dados.situacao());
        put(atendimento, "Tipo", dados.tipo());
        put(atendimento, "Topico", dados.topico());
        put(atendimento, "Fluxo", dados.fluxo());
        atendimento.put("Assunto", dados.assunto());
        put(atendimento, "Ocorrencia", dados.ocorrencia());
        atendimento.put("Usuario_Abertura", credenciais.usuarioRbx());

        ObjectNode operacao = objectMapper.createObjectNode();
        operacao.set("Autenticacao", objectMapper.createObjectNode().put("ChaveIntegracao", credenciais.chaveApi()));
        operacao.set("DadosAtendimento", atendimento);
        ObjectNode body = objectMapper.createObjectNode().set("AtendimentoCadastro", operacao);
        JsonNode response = post(urlV1, body, null);
        validarResposta(response);
        JsonNode result = response.path("result");
        return new AtendimentoRbxResultadoDTO(text(result, "NumeroAtendimento"), text(result, "Protocolo"), text(result, "Mensagem"));
    }

    public AtendimentoRbxResultadoDTO encerrar(String atendimentoNumero, AtendimentoEncerramentoRbxDTO dados,
                                                CredenciaisRbx credenciais) {
        validarEscritaAutorizada();
        return executarEncerramento(atendimentoNumero, dados, credenciais);
    }

    private AtendimentoRbxResultadoDTO executarEncerramento(String atendimentoNumero, AtendimentoEncerramentoRbxDTO dados,
                                                              CredenciaisRbx credenciais) {
        if (atendimentoNumero == null || atendimentoNumero.isBlank()) throw new IllegalArgumentException("Informe o atendimento do RBX.");
        if (dados == null || dados.causaId() == null || dados.solucao() == null || dados.solucao().isBlank()) {
            throw new IllegalArgumentException("Causa e solução são obrigatórias para encerrar o atendimento.");
        }
        validarCredenciais(credenciais);
        ObjectNode finish = objectMapper.createObjectNode();
        finish.put("ticket_id", Long.parseLong(atendimentoNumero));
        finish.put("cause_id", dados.causaId());
        finish.put("solution", dados.solucao().trim());
        if (dados.dataHora() != null) finish.put("datetime", dados.dataHora().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        finish.put("user", credenciais.usuarioRbx());
        ObjectNode body = objectMapper.createObjectNode().set("ticket_finish", finish);
        JsonNode response = post(urlV2, body, credenciais.chaveApi());
        validarResposta(response);
        return new AtendimentoRbxResultadoDTO(atendimentoNumero, "", mensagemV2(response.path("result")));
    }

    private JsonNode post(String url, JsonNode body, String headerKey) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            if (headerKey != null) headers.set("authentication_key", headerKey);
            String response = restTemplate.postForObject(url, new HttpEntity<>(body.toString(), headers), String.class);
            return objectMapper.readTree(response);
        } catch (Exception e) {
            throw new IllegalStateException("Falha de comunicação com o RBX: " + e.getMessage());
        }
    }

    private void validarAbertura(AtendimentoAberturaRbxDTO dados, CredenciaisRbx credenciais) {
        validarCredenciais(credenciais);
        if (dados == null || dados.dataAbertura() == null || dados.horaAbertura() == null || dados.cliente() == null
                || dados.iniciativa() == null || dados.modo() == null || dados.tipoCliente() == null
                || dados.assunto() == null || dados.assunto().isBlank()) {
            throw new IllegalArgumentException("Dados obrigatórios para abertura do atendimento não foram informados.");
        }
        if (dados.topico() != null && dados.fluxo() != null) throw new IllegalArgumentException("Informe tópico ou fluxo, nunca os dois.");
    }

    private void validarCredenciais(CredenciaisRbx credenciais) {
        if (credenciais == null || credenciais.usuarioRbx() == null || credenciais.usuarioRbx().isBlank()
                || credenciais.chaveApi() == null || credenciais.chaveApi().isBlank()) {
            throw new IllegalStateException("Credenciais individuais do RBX não configuradas.");
        }
    }

    private void validarEscritaAutorizada() {
        if (!escritaHabilitada) {
            throw new IllegalStateException("A abertura e o encerramento de atendimentos no RBX ainda não foram autorizados.");
        }
    }

    private void validarResposta(JsonNode response) {
        if (response == null || response.path("status").asInt(0) != 1) {
            String error = text(response, "error_description");
            if (error.isBlank()) error = text(response, "erro_desc");
            if (error.isBlank()) error = text(response, "erro_detail");
            throw new IllegalStateException(error.isBlank() ? "O RBX recusou a operação." : error);
        }
    }

    private String mensagemV2(JsonNode result) {
        JsonNode messages = result.path("messages");
        return messages.isArray() && !messages.isEmpty() ? text(messages.get(0), "message") : "Atendimento encerrado no RBX.";
    }

    private String text(JsonNode node, String field) {
        return node == null ? "" : node.path(field).asText("").trim();
    }

    private void put(ObjectNode node, String field, Object value) {
        if (value == null || String.valueOf(value).isBlank()) return;
        if (value instanceof Number number) node.put(field, number.longValue()); else node.put(field, String.valueOf(value));
    }

    private String derivarUrlV2(String v1) {
        if (v1 != null && v1.contains("/routerbox/ws/rbx_server_json.php")) {
            return v1.replace("/routerbox/ws/rbx_server_json.php", "/routerbox/ws_json/ws_json.php");
        }
        throw new IllegalStateException("Configure LINK_RBX_V2 para utilizar os serviços V2 do RBX.");
    }
}
