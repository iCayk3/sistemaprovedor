package br.com.w4solution.controle_instalacao.controller;

import br.com.w4solution.controle_instalacao.domain.usuarios.Usuario;
import br.com.w4solution.controle_instalacao.dto.whatsapp.*;
import br.com.w4solution.controle_instalacao.services.whatsapp.WhatsappService;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/integracoes/whatsapp")
public class WhatsappController {
    private final WhatsappService service;

    public WhatsappController(WhatsappService service) {
        this.service = service;
    }

    @PostMapping("/evolution/webhook/{token}")
    public void webhook(@PathVariable String token, @RequestBody JsonNode payload) {
        service.receberWebhook(token, payload);
    }

    @GetMapping("/configuracao")
    @PreAuthorize("hasRole('ADMIN')")
    public WhatsappConfiguracaoDTO configuracao() {
        return service.obterConfiguracao();
    }

    @PutMapping("/configuracao")
    @PreAuthorize("hasRole('ADMIN')")
    public WhatsappConfiguracaoDTO salvar(@RequestBody SalvarWhatsappConfiguracaoDTO dto) {
        return service.salvarConfiguracao(dto);
    }

    @GetMapping("/conversas")
    @PreAuthorize("@acessoIaChatService.permitido(authentication.principal)")
    public List<WhatsappConversaDTO> conversas() {
        return service.listarConversas();
    }

    @GetMapping("/conversas/{id}/mensagens")
    @PreAuthorize("@acessoIaChatService.permitido(authentication.principal)")
    public List<WhatsappMensagemDTO> mensagens(@PathVariable Long id) {
        return service.listarMensagens(id);
    }

    @PostMapping("/conversas/{id}/mensagens")
    @PreAuthorize("@acessoIaChatService.permitido(authentication.principal)")
    public WhatsappMensagemDTO enviar(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable Long id,
            @Valid @RequestBody EnviarWhatsappDTO dto
    ) {
        return service.enviar(usuario, id, dto.texto());
    }

    @GetMapping("/notificacoes")
    @PreAuthorize("@acessoIaChatService.permitido(authentication.principal)")
    public Map<String, Long> notificacoes() {
        return Map.of("totalNaoLidas", service.totalNaoLidas());
    }
}
