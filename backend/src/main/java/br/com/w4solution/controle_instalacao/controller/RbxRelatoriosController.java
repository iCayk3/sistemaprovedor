package br.com.w4solution.controle_instalacao.controller;

import br.com.w4solution.controle_instalacao.dto.rbx.RelatorioClientesPlanoCidadeDTO;
import br.com.w4solution.controle_instalacao.dto.rbx.RelatorioOsConcluidasResponseDTO;
import br.com.w4solution.controle_instalacao.dto.rbx.RelatorioProdutividadeOcorrenciasDTO;
import br.com.w4solution.controle_instalacao.services.rbx.RbxRelatoriosService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

import static br.com.w4solution.controle_instalacao.infra.configuration.security.SecurityExpressions.AUTHENTICATED;

@RestController
@RequestMapping("rbx/relatorios")
@PreAuthorize(AUTHENTICATED)
public class RbxRelatoriosController {

    private final RbxRelatoriosService relatoriosService;

    public RbxRelatoriosController(RbxRelatoriosService relatoriosService) {
        this.relatoriosService = relatoriosService;
    }

    /**
     * Retorna os tópicos distintos disponíveis para seleção no relatório de OS.
     */
    @GetMapping("/topicos")
    public ResponseEntity<List<String>> buscarTopicosDisponiveis(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim) {
        List<String> topicos = relatoriosService.buscarTopicosDisponiveis(inicio, fim);
        return ResponseEntity.ok(topicos);
    }

    /**
     * Relatório de atendimentos com OS Concluídas por intervalo de datas e tópicos.
     */
    @GetMapping("/os-concluidas")
    public ResponseEntity<RelatorioOsConcluidasResponseDTO> relatorioOsConcluidas(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim,
            @RequestParam(required = false) List<String> topicos,
            @RequestParam(required = false) String search) {
        RelatorioOsConcluidasResponseDTO response = relatoriosService.relatorioOsConcluidas(dataInicio, dataFim, topicos, search);
        return ResponseEntity.ok(response);
    }

    /**
     * Relatório de produtividade de equipes/usuários baseado em ocorrências de conclusão e cancelamento/abortamento de OS.
     */
    @GetMapping("/os-ocorrencias-produtividade")
    public ResponseEntity<RelatorioProdutividadeOcorrenciasDTO> relatorioProdutividadeOcorrencias(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim,
            @RequestParam(required = false, defaultValue = "true") boolean apenasGrupoTecnico) {
        RelatorioProdutividadeOcorrenciasDTO response = relatoriosService.relatorioProdutividadeOcorrencias(dataInicio, dataFim, apenasGrupoTecnico);
        return ResponseEntity.ok(response);
    }

    /**
     * Relatório de distribuição de clientes ativos por Plano x Cidade (tabela cruzada / pivot).
     */
    @GetMapping("/clientes-plano-cidade")
    public ResponseEntity<RelatorioClientesPlanoCidadeDTO> relatorioClientesPlanoCidade() {
        RelatorioClientesPlanoCidadeDTO response = relatoriosService.relatorioClientesPlanoCidade();
        return ResponseEntity.ok(response);
    }
}
