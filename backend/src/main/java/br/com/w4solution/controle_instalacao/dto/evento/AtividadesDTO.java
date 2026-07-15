package br.com.w4solution.controle_instalacao.dto.evento;

import br.com.w4solution.controle_instalacao.domain.atividades.Atividade;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record AtividadesDTO(
        Long id,
        String cliente,
        String evento,
        LocalDate data,
        String usuario,
        String segmento,
        Double valor,
        String status,
        Integer codigoCliente,
        String grupoCliente,
        String plano,
        Double valorPlano,
        LocalDateTime convertidoEm,
        String convertidoPor
) {
    public AtividadesDTO(Atividade atv){
        this(
                atv.getId(),
                atv.getCliente(),
                atv.getEvento(),
                atv.getData(),
                atv.getUsuario(),
                atv.getSegmento() != null ? atv.getSegmento() : "ATIVIDADE",
                atv.getValor(),
                atv.getStatus(),
                atv.getCodigoCliente(),
                atv.getGrupoCliente(),
                atv.getPlano(),
                atv.getValorPlano(),
                atv.getConvertidoEm(),
                atv.getConvertidoPor()
        );
    }
}
