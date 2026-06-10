package br.com.w4solution.controle_instalacao.controller;

import br.com.w4solution.controle_instalacao.dto.evento.*;
import br.com.w4solution.controle_instalacao.services.eventos.AtividadesService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static br.com.w4solution.controle_instalacao.infra.configuration.security.SecurityExpressions.COMMERCIAL_ACCESS;

@RestController
@RequestMapping("atividades")
@PreAuthorize(COMMERCIAL_ACCESS)
public class AtividadesController {

    @Autowired
    AtividadesService service;

    @GetMapping
    public ResponseEntity<List<AtividadesDTO>> listarAtividades(){
        var ativdades = service.listarAtividades();
        return ResponseEntity.ok().body(ativdades);
    }

    @GetMapping("/resumo/mensal")
    public ResponseEntity<List<ResumoMensalDTO>> resumoMensalAtividade(@RequestParam(required = false) String data){
        var atividadesResumidas = service.buscarResumoMensalAtividade(data);
        return ResponseEntity.ok().body(atividadesResumidas);
    }

    @GetMapping("/registro/mensal")
    public ResponseEntity<List<AtividadesDTO>> registroMensal(@RequestParam(required = false) String data){
        var atividades = service.listarAtividadesPorMes(data);
        return ResponseEntity.ok().body(atividades);
    }

    @GetMapping("/usuario")
    public ResponseEntity<List<ServicoPorUsuarioDiario>> listarAtividadesPorUsuario(@RequestParam(required = false) String filtro) {
        var atividades = service.listarAtividadesPorUsuario(filtro);
        return ResponseEntity.ok().body(atividades);
    }

    @PostMapping
    @Transactional
    public ResponseEntity<List<AtividadesDTO>> cadastrarAtividade(@RequestBody List<CadastrarAtividadesDTO> dados, HttpServletRequest request){
        var atividades = service.cadastrarAtividade(dados, request);
        return ResponseEntity.ok().body(atividades);
    }

    @DeleteMapping
    @Transactional
    public ResponseEntity<?> deletarAtividade (@RequestBody IdDTO id){
        service.deletarAtividade(id.id());
        return ResponseEntity.ok().build();
    }
}
