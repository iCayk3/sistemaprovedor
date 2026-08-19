package br.com.w4solution.controle_instalacao.controller;

import br.com.w4solution.controle_instalacao.domain.usuarios.Usuario;
import br.com.w4solution.controle_instalacao.dto.chat.*;
import br.com.w4solution.controle_instalacao.dto.usuarios.UsuarioDTO;
import br.com.w4solution.controle_instalacao.services.chat.ChatInternoService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/chat")
@PreAuthorize("@acessoIaChatService.permitido(authentication.principal)")
public class ChatInternoController {
    private final ChatInternoService service;

    public ChatInternoController(ChatInternoService service) {
        this.service = service;
    }

    @GetMapping("/usuarios")
    public List<UsuarioDTO> usuarios(@AuthenticationPrincipal Usuario usuario) {
        return service.listarUsuarios(usuario);
    }

    @GetMapping("/conversas")
    public List<ChatConversaDTO> conversas(@AuthenticationPrincipal Usuario usuario) {
        return service.listarConversas(usuario);
    }

    @PostMapping("/conversas")
    public ChatConversaDTO criar(
            @AuthenticationPrincipal Usuario usuario,
            @Valid @RequestBody CriarChatDTO requisicao
    ) {
        return service.criarOuAbrir(usuario, requisicao.usuarioId());
    }

    @GetMapping("/conversas/{id}/mensagens")
    public List<ChatMensagemDTO> mensagens(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable Long id
    ) {
        return service.listarMensagens(usuario, id);
    }

    @PostMapping("/conversas/{id}/mensagens")
    public ChatMensagemDTO enviar(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable Long id,
            @Valid @RequestBody EnviarChatMensagemDTO requisicao
    ) {
        return service.enviar(usuario, id, requisicao.texto());
    }

    @PostMapping("/conversas/{id}/ler")
    public void ler(@AuthenticationPrincipal Usuario usuario, @PathVariable Long id) {
        service.marcarComoLida(usuario, id);
    }

    @GetMapping("/notificacoes")
    public ChatNotificacaoDTO notificacoes(@AuthenticationPrincipal Usuario usuario) {
        return service.notificacoes(usuario);
    }
}
