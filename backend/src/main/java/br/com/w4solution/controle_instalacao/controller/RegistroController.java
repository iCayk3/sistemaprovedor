package br.com.w4solution.controle_instalacao.controller;

import br.com.w4solution.controle_instalacao.dto.evento.ResumoMensalDTO;
import br.com.w4solution.controle_instalacao.dto.registro.*;
import br.com.w4solution.controle_instalacao.services.registros.RegistroService;
import br.com.w4solution.controle_instalacao.validations.DeletarRegistroExceptions;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;

import static br.com.w4solution.controle_instalacao.infra.configuration.security.SecurityExpressions.TECHNICAL_ACCESS;

@RestController
@RequestMapping("registros")
@PreAuthorize(TECHNICAL_ACCESS)
public class RegistroController {

    @Autowired
    RegistroService service;

    @GetMapping
    public ResponseEntity<List<RegistroDTO2>> listarRegistro(@RequestParam(required = false) String equipe, @RequestParam(required = false) String filtro){
        var registros = service.listarTodosRegistros(equipe, filtro);
        return ResponseEntity.ok(registros);
    }

    @GetMapping("/totalpormes")
        public ResponseEntity<List<TotalPorMesDTO>> totalPorMes(@RequestParam(required = false) String servico){
        var total = service.listarTodosRegistroPorMes(servico);
        return ResponseEntity.ok().body(total);
    }

    @GetMapping("/servicos/tecnicos/mensal/resumo")
    public ResponseEntity<List<ServicosPorEquipeMensal>> listarServicosPorEquipe(@RequestParam(required = false) String filtro){
        var servicoPoeEquipe = service.listarServicosPorEquipe(filtro);
        return ResponseEntity.ok().body(servicoPoeEquipe);
    }

    @GetMapping("/top15")
    public ResponseEntity<List<RegistroDTO2>> listarTodosRegistros(){
        var registros = service.listarTop15Registros();
        return ResponseEntity.ok().body(registros);
    }

    @GetMapping("/servicos/mensais/resumo")
    public ResponseEntity<List<ResumoMensalDTO>> listarResumoMensal(@RequestParam(required = false) String filtro){
        var resumo = service.resumoMensal(filtro);
        return ResponseEntity.ok(resumo);
    }
    @GetMapping("/servicos/tecnico/mensal")
    public ResponseEntity<List<TotalPorEquipePorMesDTO>> listarServicosTecnicosPorMes(@RequestParam(required = false) String servico){
        var registros = service.listarTotalPorEquipeNoMes(servico);
        return ResponseEntity.ok().body(registros);
    }

    @PostMapping
    @Transactional
    public ResponseEntity<RegistroDTO2> cadastroRegistro(@RequestBody CadastroRegistroDTO dados, UriComponentsBuilder uri){

        var registro = service.cadastrarRegistro(dados);
        var uriRegistro = uri.path("/{id}").buildAndExpand(registro.getId()).toUri();
        return ResponseEntity.created(uriRegistro).body(new RegistroDTO2(registro));

    }


    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity deletarRegistro(@PathVariable Long id){
        try{
            service.deletarRegistro(id);
            return ResponseEntity.ok().build();
        }catch (DeletarRegistroExceptions e){
            return ResponseEntity.notFound().build();
        }
    }

}
