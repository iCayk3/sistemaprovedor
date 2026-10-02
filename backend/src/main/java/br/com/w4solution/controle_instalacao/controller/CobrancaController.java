package br.com.w4solution.controle_instalacao.controller;

import br.com.w4solution.controle_instalacao.domain.usuarios.Usuario;
import br.com.w4solution.controle_instalacao.dto.cobranca.CobrancaAcompanhamentoDTO;
import br.com.w4solution.controle_instalacao.dto.cobranca.CobrancaCadastroDTO;
import br.com.w4solution.controle_instalacao.dto.cobranca.CobrancaExclusaoDTO;
import br.com.w4solution.controle_instalacao.dto.cobranca.CobrancaConfiguracaoDTO;
import br.com.w4solution.controle_instalacao.dto.cobranca.MetaCobrancaMensalDTO;
import br.com.w4solution.controle_instalacao.domain.usuarios.UserRole;
import br.com.w4solution.controle_instalacao.services.cobranca.CobrancaService;
import br.com.w4solution.controle_instalacao.services.cobranca.FaturamentoMensalService;
import br.com.w4solution.controle_instalacao.services.cobranca.MetaCobrancaMensalService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;

import static br.com.w4solution.controle_instalacao.infra.configuration.security.SecurityExpressions.CHARGING_ACCESS;

@RestController
@RequestMapping("cobrancas")
public class CobrancaController {

    private final CobrancaService service;
    private final FaturamentoMensalService faturamentoMensalService;
    private final MetaCobrancaMensalService metaCobrancaMensalService;

    public CobrancaController(CobrancaService service, FaturamentoMensalService faturamentoMensalService,
                              MetaCobrancaMensalService metaCobrancaMensalService) {
        this.service = service;
        this.faturamentoMensalService = faturamentoMensalService;
        this.metaCobrancaMensalService = metaCobrancaMensalService;
    }

    @GetMapping
    @PreAuthorize(CHARGING_ACCESS)
    public ResponseEntity<?> listar(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(service.listar(nomeUsuario(usuario), podeVerGeral(usuario)));
    }

    @GetMapping("/automaticas")
    @PreAuthorize(CHARGING_ACCESS)
    public ResponseEntity<?> listarAutomaticasDisponiveis() {
        return ResponseEntity.ok(service.listarAutomaticasDisponiveis());
    }

    @GetMapping("/acompanhamento")
    @PreAuthorize(CHARGING_ACCESS)
    public ResponseEntity<?> listarAcompanhamento(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(service.listarAcompanhamento(nomeUsuario(usuario)));
    }

    @GetMapping("/pagas")
    @PreAuthorize(CHARGING_ACCESS)
    public ResponseEntity<?> listarPagas(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(service.listarPagas(nomeUsuario(usuario), podeVerGeral(usuario)));
    }

    @GetMapping("/auditoria")
    @PreAuthorize(CHARGING_ACCESS)
    public ResponseEntity<?> listarAuditoria(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(service.listarAuditoria(nomeUsuario(usuario), podeVerGeral(usuario)));
    }

    @GetMapping("/lembretes")
    @PreAuthorize(CHARGING_ACCESS)
    public ResponseEntity<?> lembretesPendentes(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(service.lembretesPendentes(nomeUsuario(usuario), podeVerGeral(usuario)));
    }

    @GetMapping("/notificacoes/encerramentos")
    @PreAuthorize(CHARGING_ACCESS)
    public ResponseEntity<?> notificacoesEncerramento(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(service.notificacoesEncerramento(nomeUsuario(usuario)));
    }

    @PatchMapping("/{id}/notificacao-encerramento/lida")
    @PreAuthorize(CHARGING_ACCESS)
    public ResponseEntity<Void> confirmarNotificacaoEncerramento(@PathVariable Long id,
                                                                  @AuthenticationPrincipal Usuario usuario) {
        service.confirmarNotificacaoEncerramento(id, nomeUsuario(usuario));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/painel/financeiro")
    @PreAuthorize(CHARGING_ACCESS)
    public ResponseEntity<?> resumoFinanceiroPainel(@RequestParam LocalDate from, @RequestParam LocalDate to) throws Exception {
        return ResponseEntity.ok(faturamentoMensalService.resumo(from));
    }

    @PostMapping(value = "/painel/faturamento/importar", consumes = "multipart/form-data")
    @PreAuthorize(CHARGING_ACCESS)
    public ResponseEntity<?> importarFaturamento(@RequestParam MultipartFile arquivo, @RequestParam LocalDate mes,
                                                  @AuthenticationPrincipal Usuario usuario) throws Exception {
        var response = faturamentoMensalService.importar(arquivo, mes, nomeUsuario(usuario));
        response.put("syncInProgress", true);
        faturamentoMensalService.sincronizarEmBackground(mes);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/painel/faturamento")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> zerarFaturamento(@RequestParam LocalDate mes) {
        return ResponseEntity.ok(faturamentoMensalService.zerar(mes));
    }

    @PostMapping("/painel/faturamento/sincronizar")
    @PreAuthorize(CHARGING_ACCESS)
    public ResponseEntity<?> sincronizarFaturamento(@RequestParam LocalDate mes) throws Exception {
        return ResponseEntity.ok(faturamentoMensalService.sincronizar(mes));
    }

    @PostMapping("/painel/faturamento/reconciliar")
    @PreAuthorize(CHARGING_ACCESS)
    public ResponseEntity<?> reconciliarFaturamentosImportados() {
        return ResponseEntity.ok(faturamentoMensalService.reconciliarImportacoesExistentes());
    }

    @GetMapping("/painel/fila-inadimplentes")
    @PreAuthorize(CHARGING_ACCESS)
    public ResponseEntity<?> filaInadimplentes() {
        return ResponseEntity.ok(service.filaInadimplentes());
    }

    @GetMapping("/painel/operacional")
    @PreAuthorize(CHARGING_ACCESS)
    public ResponseEntity<?> relatorioOperacional(@RequestParam LocalDate mes) {
        return ResponseEntity.ok(service.relatorioOperacional(mes));
    }

    @GetMapping("/painel/metas")
    @PreAuthorize(CHARGING_ACCESS)
    public ResponseEntity<?> buscarMetas(@RequestParam LocalDate mes) {
        return ResponseEntity.ok(metaCobrancaMensalService.buscar(mes));
    }

    @PutMapping("/painel/metas")
    @PreAuthorize(CHARGING_ACCESS)
    public ResponseEntity<?> salvarMetas(@RequestParam LocalDate mes, @Valid @RequestBody MetaCobrancaMensalDTO dto,
                                         @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(metaCobrancaMensalService.salvar(mes, dto, nomeUsuario(usuario)));
    }

    @PostMapping
    @PreAuthorize(CHARGING_ACCESS)
    public ResponseEntity<?> cadastrar(@Valid @RequestBody CobrancaCadastroDTO dto, @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(service.cadastrar(dto, nomeUsuario(usuario)));
    }

    @PutMapping("/{id}")
    @PreAuthorize(CHARGING_ACCESS)
    public ResponseEntity<?> atualizar(
            @PathVariable Long id,
            @Valid @RequestBody CobrancaCadastroDTO dto,
            @AuthenticationPrincipal Usuario usuario
    ) {
        return ResponseEntity.ok(service.atualizar(id, dto, nomeUsuario(usuario), isAdmin(usuario), podeVerGeral(usuario)));
    }

    @PatchMapping("/{id}/acompanhamento")
    @PreAuthorize(CHARGING_ACCESS)
    public ResponseEntity<?> acompanhar(
            @PathVariable Long id,
            @Valid @RequestBody CobrancaAcompanhamentoDTO dto,
            @AuthenticationPrincipal Usuario usuario
    ) {
        return ResponseEntity.ok(service.acompanhar(id, dto, nomeUsuario(usuario), isAdmin(usuario), podeVerGeral(usuario)));
    }

    @PatchMapping("/{id}/capturar")
    @PreAuthorize(CHARGING_ACCESS)
    public ResponseEntity<?> capturar(@PathVariable Long id, @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(service.capturar(id, usuario));
    }

    @GetMapping("/configuracao")
    @PreAuthorize(CHARGING_ACCESS)
    public ResponseEntity<?> buscarConfiguracao() {
        return ResponseEntity.ok(service.buscarConfiguracao());
    }

    @PutMapping("/configuracao")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> atualizarConfiguracao(@Valid @RequestBody CobrancaConfiguracaoDTO dto) {
        return ResponseEntity.ok(service.atualizarConfiguracao(dto));
    }

    @PatchMapping("/{id}/excluir")
    @PreAuthorize(CHARGING_ACCESS)
    public ResponseEntity<?> excluir(
            @PathVariable Long id,
            @Valid @RequestBody CobrancaExclusaoDTO dto,
            @AuthenticationPrincipal Usuario usuario
    ) {
        return ResponseEntity.ok(service.excluir(id, dto, nomeUsuario(usuario), podeVerGeral(usuario)));
    }

    @GetMapping("/rbx/clientes/{codigo}")
    @PreAuthorize(CHARGING_ACCESS)
    public ResponseEntity<?> buscarClienteRbx(@PathVariable String codigo) {
        String normalizado = String.valueOf(codigo).replaceAll("\\D", "");
        if (normalizado.isBlank()) {
            throw new IllegalArgumentException("Informe um código de cliente válido.");
        }
        return ResponseEntity.ok(service.buscarClienteRbx(Long.valueOf(normalizado)));
    }

    private String nomeUsuario(Usuario usuario) {
        return usuario == null ? "sistema" : usuario.getUsuario();
    }

    private boolean isAdmin(Usuario usuario) {
        return usuario != null && usuario.getPermissao() == UserRole.ADMIN;
    }

    private boolean podeVerGeral(Usuario usuario) {
        return isAdmin(usuario) || (usuario != null && usuario.isSupervisor());
    }
}
