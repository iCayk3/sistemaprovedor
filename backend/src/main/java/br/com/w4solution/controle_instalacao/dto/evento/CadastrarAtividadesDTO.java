package br.com.w4solution.controle_instalacao.dto.evento;

import java.time.LocalDate;

public record CadastrarAtividadesDTO(
        String cliente,
        LocalDate data,
        String evento,
        String segmento,
        Double valor,
        String status,
        Integer codigoCliente,
        String grupoCliente,
        String plano,
        Double valorPlano
) {
}
