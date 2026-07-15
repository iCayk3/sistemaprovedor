package br.com.w4solution.controle_instalacao.controller;

import br.com.w4solution.controle_instalacao.domain.usuarios.Usuario;
import br.com.w4solution.controle_instalacao.dto.cobranca.CobrancaAcompanhamentoDTO;
import br.com.w4solution.controle_instalacao.dto.cobranca.CobrancaCadastroDTO;
import br.com.w4solution.controle_instalacao.services.cobranca.CobrancaService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import static br.com.w4solution.controle_instalacao.infra.configuration.security.SecurityExpressions.CHARGING_ACCESS;

@RestController
@RequestMapping("cobrancas")
public class CobrancaController {

    private final CobrancaService service;

    public CobrancaController(CobrancaService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize(CHARGING_ACCESS)
    public ResponseEntity<?> listar() {
        return ResponseEntity.ok(service.listar());
    }

    @PostMapping
    @PreAuthorize(CHARGING_ACCESS)
    public ResponseEntity<?> cadastrar(@RequestBody CobrancaCadastroDTO dto, @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(service.cadastrar(dto, nomeUsuario(usuario)));
    }

    @PutMapping("/{id}")
    @PreAuthorize(CHARGING_ACCESS)
    public ResponseEntity<?> atualizar(
            @PathVariable Long id,
            @RequestBody CobrancaCadastroDTO dto,
            @AuthenticationPrincipal Usuario usuario
    ) {
        return ResponseEntity.ok(service.atualizar(id, dto, nomeUsuario(usuario)));
    }

    @PatchMapping("/{id}/acompanhamento")
    @PreAuthorize(CHARGING_ACCESS)
    public ResponseEntity<?> acompanhar(
            @PathVariable Long id,
            @RequestBody CobrancaAcompanhamentoDTO dto,
            @AuthenticationPrincipal Usuario usuario
    ) {
        return ResponseEntity.ok(service.acompanhar(id, dto, nomeUsuario(usuario)));
    }

    @GetMapping("/rbx/clientes/{codigo}")
    @PreAuthorize(CHARGING_ACCESS)
    public ResponseEntity<?> buscarClienteRbx(@PathVariable Long codigo) {
        return ResponseEntity.ok(service.buscarClienteRbx(codigo));
    }

    private String nomeUsuario(Usuario usuario) {
        return usuario == null ? "sistema" : usuario.getUsuario();
    }
}
