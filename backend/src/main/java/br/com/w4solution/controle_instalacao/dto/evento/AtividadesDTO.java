package br.com.w4solution.controle_instalacao.dto.evento;

import br.com.w4solution.controle_instalacao.domain.atividades.Atividade;

import java.time.LocalDate;

public record AtividadesDTO(Long id, String cliente, String evento, LocalDate data, String usuario, String segmento, Double valor) {
    public AtividadesDTO(Atividade atv){
        this(atv.getId(), atv.getCliente(), atv.getEvento(), atv.getData(), atv.getUsuario(), atv.getSegmento() != null ? atv.getSegmento() : "ATIVIDADE", atv.getValor());
    }
}
