package br.com.w4solution.controle_instalacao.controller;

import br.com.w4solution.controle_instalacao.dto.evento.*;
import br.com.w4solution.controle_instalacao.services.eventos.AtividadesService;
import br.com.w4solution.controle_instalacao.domain.usuarios.Usuario;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static br.com.w4solution.controle_instalacao.infra.configuration.security.SecurityExpressions.COMMERCIAL_OR_FINANCIAL_ACCESS;

@RestController
@RequestMapping("atividades")
@PreAuthorize(COMMERCIAL_OR_FINANCIAL_ACCESS)
public class AtividadesController {

    @Autowired
    AtividadesService service;

    @GetMapping
    public ResponseEntity<List<AtividadesDTO>> listarAtividades(@AuthenticationPrincipal Usuario usuario){
        var ativdades = service.listarAtividades(usuario);
        return ResponseEntity.ok().body(ativdades);
    }

    @GetMapping("/resumo/mensal")
    public ResponseEntity<List<ResumoMensalDTO>> resumoMensalAtividade(@RequestParam(required = false) String data, @RequestParam(required = false) String segmento, @AuthenticationPrincipal Usuario usuario){
        var atividadesResumidas = service.buscarResumoMensalAtividade(data, segmento, usuario);
        return ResponseEntity.ok().body(atividadesResumidas);
    }

    @GetMapping("/alertas")
    public ResponseEntity<List<AtividadesDTO>> listarAlertas(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(service.listarAlertas(usuario));
    }

    @GetMapping("/leads/pendentes")
    public ResponseEntity<List<AtividadesDTO>> listarLeadsPendentesDoMes(@RequestParam(required = false) String data, @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(service.listarLeadsPendentesDoMes(data, usuario));
    }

    @GetMapping("/leads/pendentes/competencias")
    public ResponseEntity<List<String>> listarCompetenciasComLeadsPendentes(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(service.listarCompetenciasComLeadsPendentes(usuario));
    }

    @GetMapping("/registro/mensal")
    public ResponseEntity<List<AtividadesDTO>> registroMensal(@RequestParam(required = false) String data, @RequestParam(required = false) String segmento, @AuthenticationPrincipal Usuario usuario){
        var atividades = service.listarAtividadesPorMes(data, segmento, usuario);
        return ResponseEntity.ok().body(atividades);
    }

    @GetMapping("/registro/anual")
    public ResponseEntity<List<AtividadesDTO>> registroAnual(@RequestParam(required = false) String data, @RequestParam(required = false) String segmento, @AuthenticationPrincipal Usuario usuario){
        var atividades = service.listarAtividadesPorAno(data, segmento, usuario);
        return ResponseEntity.ok().body(atividades);
    }

    @GetMapping("/usuario")
    public ResponseEntity<List<ServicoPorUsuarioDiario>> listarAtividadesPorUsuario(@RequestParam(required = false) String filtro, @RequestParam(required = false) String segmento, @AuthenticationPrincipal Usuario usuario) {
        var atividades = service.listarAtividadesPorUsuario(filtro, segmento, usuario);
        return ResponseEntity.ok().body(atividades);
    }

    @GetMapping("/usuario/mensal")
    public ResponseEntity<List<ServicoPorUsuarioDiario>> listarAtividadesMensaisPorUsuario(@RequestParam(required = false) String data, @RequestParam(required = false) String segmento, @AuthenticationPrincipal Usuario usuario) {
        var atividades = service.listarAtividadesMensaisPorUsuario(data, segmento, usuario);
        return ResponseEntity.ok().body(atividades);
    }

    @GetMapping("/rbx/clientes/{codigo}")
    public ResponseEntity<AtividadeClienteRbxDTO> buscarClienteAtividadeRbx(@PathVariable Integer codigo) {
        var cliente = service.buscarClienteAtividadeRbx(codigo);
        return ResponseEntity.ok().body(cliente);
    }

    @GetMapping("/rbx/clientes/{codigo}/contratos")
    public ResponseEntity<List<ContratoLeadRbxDTO>> listarContratosParaConversao(@PathVariable Integer codigo) {
        return ResponseEntity.ok(service.listarContratosParaConversao(codigo));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<List<AtividadesDTO>> cadastrarAtividade(@RequestBody List<CadastrarAtividadesDTO> dados, HttpServletRequest request){
        var atividades = service.cadastrarAtividade(dados, request);
        return ResponseEntity.ok().body(atividades);
    }

    @PatchMapping("/{id}/converter-lead")
    @Transactional
    public ResponseEntity<AtividadesDTO> converterLead(@PathVariable Long id, @RequestBody ConverterLeadDTO dados, HttpServletRequest request, @AuthenticationPrincipal Usuario usuario){
        var atividade = service.converterLead(id, dados, request, usuario);
        return ResponseEntity.ok().body(atividade);
    }

    @PatchMapping("/{id}/venda-nao-concluida")
    @Transactional
    public ResponseEntity<AtividadesDTO> registrarVendaNaoConcluida(@PathVariable Long id, @RequestBody NaoConcluirVendaDTO dados, HttpServletRequest request, @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(service.registrarVendaNaoConcluida(id, dados, request, usuario));
    }

    @DeleteMapping
    @Transactional
    public ResponseEntity<?> deletarAtividade (@RequestBody IdDTO id, @AuthenticationPrincipal Usuario usuario){
        service.deletarAtividade(id.id(), usuario);
        return ResponseEntity.ok().build();
    }
}
