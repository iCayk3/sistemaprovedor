package br.com.w4solution.controle_instalacao.controller;

import br.com.w4solution.controle_instalacao.dto.registro.AtualizarProcedimentoDto;
import br.com.w4solution.controle_instalacao.dto.registro.CadastroProcedimentoDTO;
import br.com.w4solution.controle_instalacao.dto.registro.ProcedimentoDTO;
import br.com.w4solution.controle_instalacao.services.registros.ProcedimentoService;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static br.com.w4solution.controle_instalacao.infra.configuration.security.SecurityExpressions.TECHNICAL_ACCESS;

@RestController
@RequestMapping("procedimento")
@PreAuthorize(TECHNICAL_ACCESS)
public class ProcedimentoController {

    @Autowired
    ProcedimentoService service;

    @GetMapping
    public ResponseEntity<List<ProcedimentoDTO>> listarProcedimentos(){
        var procedimentos = service.buscaProcedimentos().stream().map(ProcedimentoDTO::new).toList();
        return ResponseEntity.ok().body(procedimentos);
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> cadastrarProcedimento(@RequestBody CadastroProcedimentoDTO dados){
        service.cadastrarProcedimento(dados);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> atualizarProcedimento(@PathVariable Long id, @RequestBody AtualizarProcedimentoDto dados){
        service.atualizarProcedimento(id, dados);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deletarProcedimento(@PathVariable Long id){
        service.deletarProcedimento(id);
        return ResponseEntity.ok().build();
    }
}
