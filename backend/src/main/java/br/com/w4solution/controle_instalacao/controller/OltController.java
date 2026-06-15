package br.com.w4solution.controle_instalacao.controller;

import br.com.w4solution.controle_instalacao.dto.olt.*;
import br.com.w4solution.controle_instalacao.services.olt.OltService;
import br.com.w4solution.controle_instalacao.validations.ValidacaoCtoException;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;

import static br.com.w4solution.controle_instalacao.infra.configuration.security.SecurityExpressions.TECHNICAL_ACCESS;

@RestController
@RequestMapping("olt")
@PreAuthorize(TECHNICAL_ACCESS)
public class OltController {

    @Autowired
    OltService oltService;

    @GetMapping
    public ResponseEntity<List<OltDTO>> listarOlts() {
        var olts = oltService.listarOlts();
        return ResponseEntity.ok(olts);
    }

    @GetMapping("{id}/cto")
    public ResponseEntity<List<CtoDTO>> listarCtos(@PathVariable Long id) {
        return ResponseEntity.ok(oltService.listarCtos(id));
    }

    @GetMapping("/cto/{id}/portas")
    public ResponseEntity<List<PortaDTORbx>> listarPortas(@PathVariable Long id) {
        return ResponseEntity.ok(oltService.listarPortas(id));
    }


    @GetMapping("/{id}/ctos")
    public ResponseEntity<List<CtoComPortasDTO>> listarTodasCtosComPortas(@PathVariable Long id) {
        var ctos = oltService.listarTodasCtos(id);
        return ResponseEntity.ok().body(ctos);
    }

    @PostMapping
    @Transactional
    public ResponseEntity<OltDTO> cadastrarOlt(@RequestBody @Valid CadastroOlt cadastroOlt, UriComponentsBuilder uri) {
        var olt = oltService.cadastrarOlt(cadastroOlt);
        var oltCriada = uri.path("/olt/{id}").buildAndExpand(olt.getId()).toUri();
        return ResponseEntity.created(oltCriada).body(new OltDTO(olt));
    }

    @PostMapping("/cto")
    @Transactional
    public ResponseEntity<CtoDTO> cadastrarCTO(@RequestBody @Valid CadastroCTO dados, UriComponentsBuilder uri) {
        var cto = oltService.cadastrarCto(dados);
        var oltCriada = uri.path("/olt/cto/{id}").buildAndExpand(cto.getId()).toUri();
        return ResponseEntity.created(oltCriada).body(new CtoDTO(cto));
    }

    @PostMapping("/cto/porta/cadastrar")
    @Transactional
    public ResponseEntity<?> cadastrarClienteNaPorta(@RequestBody CadastrarClienteNaPortaDTO dados) {
        oltService.cadastrarClienteNaPorta(dados);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/cto/{id}")
    @Transactional
    public ResponseEntity<?> editarCto(@PathVariable Long id, @RequestBody AtualizarCtoDto dados) {
        oltService.editarCto(id, dados);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/cto/{id}")
    @Transactional
    public ResponseEntity<?> deletarCto(@PathVariable Long id) {
        oltService.deletarCto(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/cto/porta/{id}")
    @Transactional
    public ResponseEntity<?> deletarClienteDaPorta(@PathVariable Long id) {
        oltService.deletarClienteDaPorta(id);
        return ResponseEntity.ok().build();
    }
}
