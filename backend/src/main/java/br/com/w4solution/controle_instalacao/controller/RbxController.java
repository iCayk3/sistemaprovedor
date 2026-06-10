package br.com.w4solution.controle_instalacao.controller;

import br.com.w4solution.controle_instalacao.dto.cliente.BoletosBaixadosRbxDTO;
import br.com.w4solution.controle_instalacao.dto.rbx.ClienteFiltradoDTO;
import br.com.w4solution.controle_instalacao.infra.configuration.exceptions.ValidacaoCnsultaRBX;
import br.com.w4solution.controle_instalacao.services.rbx.ServiceRbx;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

import static br.com.w4solution.controle_instalacao.infra.configuration.security.SecurityExpressions.FINANCIAL_ACCESS;

@RestController
@RequestMapping("rbx")
@PreAuthorize(FINANCIAL_ACCESS)
public class RbxController {

    @Autowired
    ServiceRbx service;

    /*
        resultado são boletos baixados por cidade exibindo cidade e valor, label e value respectivamente
    */
    @PostMapping("/boletosbaixadoscidade")
    public ResponseEntity<?> boletosBaixadosPorCidade(@RequestParam(required = false) LocalDate data) {
        var response = service.boletosBaixadosPorCidade(data);
        return ResponseEntity.ok().body(response);
    }

    /*
        Busca todos os boletos em abertos e soma, pode passar como parametros status do cliente os STATUS são:
        A, B, N, S
     */
    @PostMapping("/boletosabertos")
    public ResponseEntity<?> boletosAbertos(@RequestParam(required = false) String status) {
        var response = service.boletosAbertos(status);
        return ResponseEntity.ok().body(response);
    }

    /*
        traz todos os boletos abertos por cidade
     */
    @PostMapping("/boletosabertos/cidade")
    public ResponseEntity<?> boletosAbertosPorCidade() {
        var response = service.boletosAbertosPorCidade();
        return ResponseEntity.ok().body(response);
    }

    /*
        Total de clientes inadiplentes ou suspenso dependendo do que for passado como parametro
     */
    @PostMapping("/boletosabertos/inadiplentes")
    public ResponseEntity<?> totalInadiplentes(@RequestParam(required = false) String status) {
        var response = service.totalInadimplentes(status);
        return ResponseEntity.ok().body(response);
    }

    /*
        Total de clientes inadiplentes ou suspenso dependendo do que for passado como parametro por cidade
     */
    @PostMapping("/boletosabertos/inadiplentes/cidade")
    public ResponseEntity<?> totalInadiplentesPorCidade(@RequestParam(required = false) String suspenso) {
        var response = service.totalInadimplentesCidade(suspenso);
        return ResponseEntity.ok().body(response);
    }

    /*
        Clientes inadiplentes podendo passar como parametro o status
     */
    @PostMapping("/boletosabertos/inadiplentes/clientes")
    public ResponseEntity<?> clientesInadiplentes(@RequestParam(required = false) String suspenso) {
        var response = service.clientesInadimplentes(suspenso);
        return ResponseEntity.ok().body(response);
    }

    /*
        Buscar cliente do RBX por id
     */
    @PostMapping("/clientes/{id}")
    public ResponseEntity<ClienteFiltradoDTO> buscarClientePorId(@PathVariable Long id) {
        var response = service.buscarClienteId(id);
        return ResponseEntity.ok().body(response.get(0));
    }

    @PostMapping("/boletosbaixados")
    public ResponseEntity<?> valorBaixadoNoDia(@RequestParam(required = false) String data) {
        var response = service.buscarValorTotalBoletosBaixados(data);
        return ResponseEntity.ok().body(response);
    }
    @PostMapping("/suspensosemcobranca")
    public ResponseEntity<?> suspensosSemCobranca() {
        var response = service.buscarClientesSuspensoSemCobrança();
        return ResponseEntity.ok().body(response);
    }
}
