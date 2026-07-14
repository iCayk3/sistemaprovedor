package br.com.w4solution.controle_instalacao.controller;

import br.com.w4solution.controle_instalacao.domain.usuarios.Usuario;
import br.com.w4solution.controle_instalacao.dto.noc.NocEventoAtualizacaoDTO;
import br.com.w4solution.controle_instalacao.dto.noc.NocEventoCadastroDTO;
import br.com.w4solution.controle_instalacao.services.noc.NocEventoService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import static br.com.w4solution.controle_instalacao.infra.configuration.security.SecurityExpressions.AUTHENTICATED;
import static br.com.w4solution.controle_instalacao.infra.configuration.security.SecurityExpressions.TECHNICAL_ACCESS;

@RestController
@RequestMapping("noc-eventos")
public class NocEventoController {

    private final NocEventoService service;

    public NocEventoController(NocEventoService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize(AUTHENTICATED)
    public ResponseEntity<?> listar() {
        return ResponseEntity.ok(service.listar());
    }

    @PostMapping
    @PreAuthorize(TECHNICAL_ACCESS)
    public ResponseEntity<?> cadastrar(@RequestBody NocEventoCadastroDTO dto) {
        return ResponseEntity.ok(service.cadastrar(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize(TECHNICAL_ACCESS)
    public ResponseEntity<?> atualizar(
            @PathVariable Long id,
            @RequestBody NocEventoAtualizacaoDTO dto,
            @AuthenticationPrincipal Usuario usuario
    ) {
        String nomeUsuario = usuario == null ? "sistema" : usuario.getUsuario();
        return ResponseEntity.ok(service.atualizar(id, dto, nomeUsuario));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize(TECHNICAL_ACCESS)
    public ResponseEntity<?> deletar(@PathVariable Long id) {
        service.deletar(id);
        return ResponseEntity.noContent().build();
    }
}
