package br.com.w4solution.controle_instalacao.services.eventos;

import br.com.w4solution.controle_instalacao.domain.atividades.Evento;
import br.com.w4solution.controle_instalacao.dto.evento.AtualizarEventoDTO;
import br.com.w4solution.controle_instalacao.dto.evento.EventoDTO;
import br.com.w4solution.controle_instalacao.dto.evento.cadastrarEventoDTO;
import br.com.w4solution.controle_instalacao.repository.eventos.EventoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class EventoService {

    private static final Map<String, List<String>> OPCOES_PADRAO_COBRANCA = Map.of(
            "COBRANCA_ACAO", List.of("CONTATO", "SEM RETORNO", "PROMESSA DE PAGAMENTO", "ACORDO", "SEGUNDA VIA ENVIADA", "CONTESTACAO", "NEGATIVACAO", "PAGO"),
            "COBRANCA_STATUS", List.of("COBRANÇA EMITIDA", "PROMESSA DE PAGAMENTO", "SEM RETORNO", "PAGO", "CANCELADO")
    );

    private final EventoRepository repository;

    public EventoService(EventoRepository repository) {
        this.repository = repository;
    }

    public Evento cadastrarEvento(cadastrarEventoDTO dados) {
        var evento = new Evento(null, dados.evento(), normalizarSegmento(dados.segmento()), Boolean.TRUE.equals(dados.encerraAtendimento()));
        repository.save(evento);
        return evento;
    }

    @Transactional
    public List<EventoDTO> listarEventos(String segmento) {
        var segmentoNormalizado = normalizarSegmento(segmento);
        var eventos = repository.encontrarPorSegmento(segmentoNormalizado);
        var opcoesPadrao = OPCOES_PADRAO_COBRANCA.get(segmentoNormalizado);
        if (eventos.isEmpty() && opcoesPadrao != null) {
            repository.saveAll(opcoesPadrao.stream()
                    .map(opcao -> new Evento(null, opcao, segmentoNormalizado, encerraAtendimentoPadrao(opcao)))
                    .toList());
            eventos = repository.encontrarPorSegmento(segmentoNormalizado);
        }
        if ("COBRANCA_STATUS".equals(segmentoNormalizado)) {
            eventos.stream()
                    .filter(evento -> evento.getEncerraAtendimento() == null)
                    .forEach(evento -> evento.setEncerraAtendimento(encerraAtendimentoPadrao(evento.getEvento())));
            repository.saveAll(eventos);
        }
        return eventos.stream().map(EventoDTO::new).toList();
    }

    public void editarEvento(Long id, AtualizarEventoDTO ev) {
        var eventoOptional = repository.findById(id);
        if(eventoOptional.isPresent()){
            var evento = eventoOptional.get();
            evento.atualizarEvento(ev.evento());
            evento.atualizarSegmento(normalizarSegmento(ev.segmento()));
            evento.atualizarEncerraAtendimento(Boolean.TRUE.equals(ev.encerraAtendimento()));
        }else {
            throw new RuntimeException("Evento nao encontrado");
        }
    }

    public void deletarEvento(Long id) {
        repository.deleteById(id);
    }

    private String normalizarSegmento(String segmento) {
        if(segmento == null || segmento.isBlank()){
            return "ATIVIDADE";
        }
        return segmento.trim().toUpperCase();
    }

    private boolean encerraAtendimentoPadrao(String opcao) {
        return "PAGO".equalsIgnoreCase(opcao) || "CANCELADO".equalsIgnoreCase(opcao);
    }
}
