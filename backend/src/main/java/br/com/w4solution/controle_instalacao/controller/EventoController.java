package br.com.w4solution.controle_instalacao.controller;

import br.com.w4solution.controle_instalacao.dto.evento.AtualizarEventoDTO;
import br.com.w4solution.controle_instalacao.dto.evento.EventoDTO;
import br.com.w4solution.controle_instalacao.dto.evento.cadastrarEventoDTO;
import br.com.w4solution.controle_instalacao.services.eventos.EventoService;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("evento")
public class EventoController {

    @Autowired
    EventoService service;

    @GetMapping
    public ResponseEntity<List<EventoDTO>> listarEventos(){
        var eventos = service.listarEventos();
        return ResponseEntity.ok().body(eventos);
    }

    @PostMapping
    @Transactional
    public ResponseEntity<EventoDTO> cadastrarEvento(@RequestBody cadastrarEventoDTO dados){
        var evento = service.cadastrarEvento(dados);
        return ResponseEntity.ok().body(new EventoDTO(evento));
    }
    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> editarEvento(@PathVariable Long id, @RequestBody AtualizarEventoDTO ev){
        service.editarEvento(id, ev);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> editarEvento(@PathVariable Long id){
        service.deletarEvento(id);
        return ResponseEntity.ok().build();
    }
}
