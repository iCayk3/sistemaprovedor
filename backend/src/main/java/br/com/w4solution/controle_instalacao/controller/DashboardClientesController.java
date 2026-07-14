package br.com.w4solution.controle_instalacao.controller;

import br.com.w4solution.controle_instalacao.services.dashboard.DashboardClientesService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

import static br.com.w4solution.controle_instalacao.infra.configuration.security.SecurityExpressions.FINANCIAL_ACCESS;

@RestController
@RequestMapping("dashboard-clientes")
@PreAuthorize(FINANCIAL_ACCESS)
public class DashboardClientesController {

    private final DashboardClientesService service;

    public DashboardClientesController(DashboardClientesService service) {
        this.service = service;
    }

    @GetMapping("/clientes/resumo")
    public ResponseEntity<?> resumoClientes() throws Exception {
        return ResponseEntity.ok(service.resumoClientes());
    }

    @GetMapping("/financeiro/resumo")
    public ResponseEntity<?> resumoFinanceiro(@RequestParam LocalDate from, @RequestParam LocalDate to) throws Exception {
        return ResponseEntity.ok(service.resumoFinanceiro(from, to));
    }

    @GetMapping("/atendimentos/resumo")
    public ResponseEntity<?> resumoAtendimentos(@RequestParam LocalDate from, @RequestParam LocalDate to) throws Exception {
        return ResponseEntity.ok(service.resumoAtendimentos(from, to));
    }
}
