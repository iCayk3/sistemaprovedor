package br.com.w4solution.controle_instalacao.services.whatsapp;

import br.com.w4solution.controle_instalacao.domain.usuarios.Usuario;
import br.com.w4solution.controle_instalacao.domain.whatsapp.*;
import br.com.w4solution.controle_instalacao.dto.whatsapp.*;
import br.com.w4solution.controle_instalacao.repository.whatsapp.*;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.transaction.Transactional;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;
import java.util.Map;

@Service
public class WhatsappService {
    private final WhatsappConfiguracaoRepository configuracaoRepository;
    private final WhatsappConversaRepository conversaRepository;
    private final WhatsappMensagemRepository mensagemRepository;

    public WhatsappService(
            WhatsappConfiguracaoRepository configuracaoRepository,
            WhatsappConversaRepository conversaRepository,
            WhatsappMensagemRepository mensagemRepository
    ) {
        this.configuracaoRepository = configuracaoRepository;
        this.conversaRepository = conversaRepository;
        this.mensagemRepository = mensagemRepository;
    }

    public WhatsappConfiguracaoDTO obterConfiguracao() {
        return new WhatsappConfiguracaoDTO(configuracao());
    }

    @Transactional
    public WhatsappConfiguracaoDTO salvarConfiguracao(SalvarWhatsappConfiguracaoDTO dto) {
        WhatsappConfiguracao config = configuracao();
        config.atualizar(dto.provedor(), dto.ativo(), dto.evolutionUrl(), dto.evolutionInstancia(),
                dto.evolutionApiKey(), dto.webhookPublicUrl());
        if (config.isAtivo() && config.getProvedor() == ProvedorWhatsapp.EVOLUTION) {
            validarEvolution(config);
            configurarWebhook(config);
        }
        return new WhatsappConfiguracaoDTO(configuracaoRepository.save(config));
    }

    @Transactional
    public void receberWebhook(String token, JsonNode payload) {
        WhatsappConfiguracao config = configuracao();
        if (!config.isAtivo() || !config.getWebhookToken().equals(token)) {
            throw new AccessDeniedException("Webhook invalido.");
        }
        String evento = payload.path("event").asText("").toUpperCase().replace('.', '_');
        if (!evento.isBlank() && !"MESSAGES_UPSERT".equals(evento)) return;
        JsonNode data = payload.path("data");
        if (data.isArray()) data.forEach(item -> importarMensagem(payload, item));
        else importarMensagem(payload, data);
    }

    public List<WhatsappConversaDTO> listarConversas() {
        return conversaRepository.findAllByOrderByAtualizadaEmDesc().stream().map(this::converter).toList();
    }

    @Transactional
    public List<WhatsappMensagemDTO> listarMensagens(Long conversaId) {
        WhatsappConversa conversa = conversaRepository.findById(conversaId)
                .orElseThrow(() -> new IllegalArgumentException("Conversa WhatsApp nao encontrada."));
        conversa.marcarLida();
        conversaRepository.save(conversa);
        return mensagemRepository.findByConversaIdOrderByEnviadaEmAsc(conversaId)
                .stream().map(WhatsappMensagemDTO::new).toList();
    }

    @Transactional
    public WhatsappMensagemDTO enviar(Usuario usuario, Long conversaId, String texto) {
        WhatsappConfiguracao config = configuracao();
        validarEvolution(config);
        WhatsappConversa conversa = conversaRepository.findById(conversaId)
                .orElseThrow(() -> new IllegalArgumentException("Conversa WhatsApp nao encontrada."));

        JsonNode resposta = RestClient.builder().baseUrl(config.getEvolutionUrl()).build().post()
                .uri("/message/sendText/{instance}", config.getEvolutionInstancia())
                .header("apikey", config.getEvolutionApiKey())
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("number", conversa.getNumero(), "textMessage", Map.of("text", texto.trim())))
                .retrieve().body(JsonNode.class);
        String idExterno = resposta == null ? null : resposta.path("key").path("id").asText(null);
        WhatsappMensagem mensagem = mensagemRepository.save(
                new WhatsappMensagem(conversa, usuario, idExterno, false, texto.trim())
        );
        conversa.atualizar(null);
        conversaRepository.save(conversa);
        return new WhatsappMensagemDTO(mensagem);
    }

    public long totalNaoLidas() {
        return conversaRepository.findAll().stream()
                .mapToLong(c -> mensagemRepository.countByConversaIdAndRecebidaTrueAndEnviadaEmAfter(c.getId(), c.getLidaEm()))
                .sum();
    }

    private void importarMensagem(JsonNode raiz, JsonNode data) {
        JsonNode key = data.path("key");
        if (key.path("fromMe").asBoolean(false)) return;
        String remoteJid = key.path("remoteJid").asText("");
        if (remoteJid.endsWith("@g.us")) return;
        String numero = remoteJid.replaceAll("\\D", "");
        String idExterno = key.path("id").asText("");
        String texto = extrairTexto(data.path("message"));
        if (numero.isBlank() || texto.isBlank() || (!idExterno.isBlank() && mensagemRepository.existsByIdExterno(idExterno))) return;
        String instancia = raiz.path("instance").asText(configuracao().getEvolutionInstancia());
        String nome = data.path("pushName").asText(numero);
        WhatsappConversa conversa = conversaRepository.findByInstanciaAndNumero(instancia, numero)
                .orElseGet(() -> conversaRepository.save(new WhatsappConversa(instancia, numero, nome)));
        conversa.atualizar(nome);
        conversaRepository.save(conversa);
        mensagemRepository.save(new WhatsappMensagem(conversa, null, idExterno.isBlank() ? null : idExterno, true, texto));
    }

    private String extrairTexto(JsonNode message) {
        if (message.hasNonNull("conversation")) return message.get("conversation").asText();
        if (message.path("extendedTextMessage").hasNonNull("text")) return message.path("extendedTextMessage").get("text").asText();
        if (message.path("imageMessage").hasNonNull("caption")) return "[Imagem] " + message.path("imageMessage").get("caption").asText();
        if (message.path("documentMessage").hasNonNull("fileName")) return "[Documento] " + message.path("documentMessage").get("fileName").asText();
        if (message.has("audioMessage")) return "[Áudio recebido]";
        if (message.has("videoMessage")) return "[Vídeo recebido]";
        return "";
    }

    private WhatsappConversaDTO converter(WhatsappConversa conversa) {
        String ultima = mensagemRepository.findTopByConversaIdOrderByEnviadaEmDesc(conversa.getId())
                .map(WhatsappMensagem::getTexto).orElse("");
        long naoLidas = mensagemRepository.countByConversaIdAndRecebidaTrueAndEnviadaEmAfter(
                conversa.getId(), conversa.getLidaEm());
        return new WhatsappConversaDTO(conversa.getId(), conversa.getNumero(), conversa.getNome(),
                ultima, conversa.getAtualizadaEm(), naoLidas);
    }

    private WhatsappConfiguracao configuracao() {
        return configuracaoRepository.findById(1L).orElseGet(() -> configuracaoRepository.save(new WhatsappConfiguracao()));
    }

    private void validarEvolution(WhatsappConfiguracao config) {
        if (config.getProvedor() != ProvedorWhatsapp.EVOLUTION) {
            throw new IllegalStateException("A API oficial do WhatsApp ainda nao foi implementada.");
        }
        if (config.getEvolutionUrl() == null || config.getEvolutionUrl().isBlank()
                || config.getEvolutionInstancia() == null || config.getEvolutionInstancia().isBlank()
                || config.getEvolutionApiKey() == null || config.getEvolutionApiKey().isBlank()) {
            throw new IllegalStateException("Informe URL, instancia e API key da Evolution.");
        }
    }

    private void configurarWebhook(WhatsappConfiguracao config) {
        if (config.getWebhookPublicUrl() == null || config.getWebhookPublicUrl().isBlank()) {
            throw new IllegalStateException("Informe a URL publica do webhook.");
        }
        String destino = config.getWebhookPublicUrl().replaceAll("/+$", "")
                + "/" + config.getWebhookToken();
        RestClient.builder().baseUrl(config.getEvolutionUrl()).build().post()
                .uri("/webhook/set/{instance}", config.getEvolutionInstancia())
                .header("apikey", config.getEvolutionApiKey())
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of(
                        "enabled", true,
                        "url", destino,
                        "events", List.of("MESSAGES_UPSERT"),
                        "base64", false
                ))
                .retrieve().toBodilessEntity();
    }
}
