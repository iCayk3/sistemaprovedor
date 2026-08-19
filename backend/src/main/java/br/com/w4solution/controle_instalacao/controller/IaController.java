package br.com.w4solution.controle_instalacao.controller;

import br.com.w4solution.controle_instalacao.dto.ia.IaMensagemDTO;
import br.com.w4solution.controle_instalacao.dto.ia.IaRespostaDTO;
import br.com.w4solution.controle_instalacao.dto.ia.CriarConversaIaDTO;
import br.com.w4solution.controle_instalacao.dto.ia.ConversaIaDTO;
import br.com.w4solution.controle_instalacao.dto.ia.EnviarMensagemChatDTO;
import br.com.w4solution.controle_instalacao.dto.ia.MensagemChatDTO;
import br.com.w4solution.controle_instalacao.dto.ia.RespostaMensagemChatDTO;
import br.com.w4solution.controle_instalacao.domain.usuarios.Usuario;
import br.com.w4solution.controle_instalacao.services.ia.ChatIaService;
import br.com.w4solution.controle_instalacao.services.ia.IaContextoService;
import br.com.w4solution.controle_instalacao.services.ia.IaService;
import br.com.w4solution.controle_instalacao.services.ia.ProvedorIaService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/ia")
@PreAuthorize("@acessoIaChatService.permitido(authentication.principal)")
public class IaController {
    private final IaService iaService;
    private final ProvedorIaService provedorIaService;
    private final IaContextoService contextoService;
    private final ChatIaService chatIaService;

    public IaController(
            IaService iaService,
            ProvedorIaService provedorIaService,
            IaContextoService contextoService,
            ChatIaService chatIaService
    ) {
        this.iaService = iaService;
        this.provedorIaService = provedorIaService;
        this.contextoService = contextoService;
        this.chatIaService = chatIaService;
    }

    @GetMapping("/status")
    public Map<String, Object> status() {
        return Map.of(
                "configurada", provedorIaService.configurado(),
                "provedor", provedorIaService.provedor(),
                "modelo", provedorIaService.modelo()
        );
    }

    @GetMapping("/indicadores")
    public Map<String, Object> indicadores() {
        return contextoService.resumo();
    }

    @PostMapping("/atendimento")
    public ResponseEntity<IaRespostaDTO> atendimento(@Valid @RequestBody IaMensagemDTO requisicao) {
        return ResponseEntity.ok(iaService.atendimento(requisicao.mensagem()));
    }

    @PostMapping("/analise")
    public ResponseEntity<IaRespostaDTO> analise(@Valid @RequestBody IaMensagemDTO requisicao) {
        return ResponseEntity.ok(iaService.analisar(requisicao.mensagem()));
    }

    @GetMapping("/conversas")
    public List<ConversaIaDTO> listarConversas(@AuthenticationPrincipal Usuario usuario) {
        return chatIaService.listarConversas(usuario);
    }

    @PostMapping("/conversas")
    public ConversaIaDTO criarConversa(
            @AuthenticationPrincipal Usuario usuario,
            @RequestBody(required = false) CriarConversaIaDTO requisicao
    ) {
        var modo = requisicao == null ? null : requisicao.modo();
        return chatIaService.criarConversa(
                usuario,
                modo == null ? br.com.w4solution.controle_instalacao.domain.ia.ModoConversa.ATENDIMENTO : modo
        );
    }

    @GetMapping("/conversas/{conversaId}/mensagens")
    public List<MensagemChatDTO> listarMensagens(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable Long conversaId
    ) {
        return chatIaService.listarMensagens(usuario, conversaId);
    }

    @PostMapping("/conversas/{conversaId}/mensagens")
    public RespostaMensagemChatDTO enviarMensagem(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable Long conversaId,
            @Valid @RequestBody EnviarMensagemChatDTO requisicao
    ) {
        return chatIaService.enviar(usuario, conversaId, requisicao.mensagem());
    }
}
