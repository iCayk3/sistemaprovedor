package br.com.w4solution.controle_instalacao.controller;

import br.com.w4solution.controle_instalacao.dto.evento.AtualizarEventoDTO;
import br.com.w4solution.controle_instalacao.dto.evento.EventoDTO;
import br.com.w4solution.controle_instalacao.dto.evento.cadastrarEventoDTO;
import br.com.w4solution.controle_instalacao.services.eventos.EventoService;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static br.com.w4solution.controle_instalacao.infra.configuration.security.SecurityExpressions.ADMIN_ONLY;
import static br.com.w4solution.controle_instalacao.infra.configuration.security.SecurityExpressions.COMMERCIAL_OR_FINANCIAL_ACCESS;

@RestController
@RequestMapping("evento")
@PreAuthorize(COMMERCIAL_OR_FINANCIAL_ACCESS)
public class EventoController {

    private final EventoService service;

    public EventoController(EventoService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<EventoDTO>> listarEventos(@RequestParam(required = false) String segmento){
        var eventos = service.listarEventos(segmento);
        return ResponseEntity.ok().body(eventos);
    }

    @PostMapping
    @Transactional
    @PreAuthorize(ADMIN_ONLY)
    public ResponseEntity<EventoDTO> cadastrarEvento(@Valid @RequestBody cadastrarEventoDTO dados){
        var evento = service.cadastrarEvento(dados);
        return ResponseEntity.ok().body(new EventoDTO(evento));
    }

    @PutMapping("/{id}")
    @Transactional
    @PreAuthorize(ADMIN_ONLY)
    public ResponseEntity<?> editarEvento(@PathVariable Long id, @Valid @RequestBody AtualizarEventoDTO ev){
        service.editarEvento(id, ev);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    @Transactional
    @PreAuthorize(ADMIN_ONLY)
    public ResponseEntity<?> deletarEvento(@PathVariable Long id){
        service.deletarEvento(id);
        return ResponseEntity.ok().build();
    }
}
