package br.com.w4solution.controle_instalacao.dto.evento;

import br.com.w4solution.controle_instalacao.domain.atividades.Evento;

public record EventoDTO(Long id, String label, String segmento, Boolean encerraAtendimento) {
    public EventoDTO(Evento e){
        this(e.getId(), e.getEvento(), e.getSegmento() != null ? e.getSegmento() : "ATIVIDADE", Boolean.TRUE.equals(e.getEncerraAtendimento()));
    }
}
