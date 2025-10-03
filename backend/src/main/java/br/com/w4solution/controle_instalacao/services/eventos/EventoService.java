package br.com.w4solution.controle_instalacao.services.eventos;

import br.com.w4solution.controle_instalacao.domain.atividades.Evento;
import br.com.w4solution.controle_instalacao.dto.evento.AtualizarEventoDTO;
import br.com.w4solution.controle_instalacao.dto.evento.EventoDTO;
import br.com.w4solution.controle_instalacao.dto.evento.cadastrarEventoDTO;
import br.com.w4solution.controle_instalacao.repository.eventos.EventoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EventoService {

    @Autowired
    EventoRepository repository;

    public Evento cadastrarEvento(cadastrarEventoDTO dados) {
        var evento = new Evento(null, dados.evento());
        repository.save(evento);
        return evento;
    }

    public List<EventoDTO> listarEventos() {
        return repository.findAll().stream().map(EventoDTO::new).toList();
    }

    public void editarEvento(Long id, AtualizarEventoDTO ev) {
        var eventoOptional = repository.findById(id);
        if(eventoOptional.isPresent()){
            var evento = eventoOptional.get();
            evento.atualizarEvento(ev.evento());
        }else {
            throw new RuntimeException("Evento nao encontrado");
        }
    }

    public void deletarEvento(Long id) {
        repository.deleteById(id);
    }
}
