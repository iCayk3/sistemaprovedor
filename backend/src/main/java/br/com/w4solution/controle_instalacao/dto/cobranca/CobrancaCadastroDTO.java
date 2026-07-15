package br.com.w4solution.controle_instalacao.dto.cobranca;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CobrancaCadastroDTO(
        String acao,
        Integer codigoCliente,
        String cliente,
        String grupoCliente,
        LocalDate data,
        LocalDate dataPromessa,
        BigDecimal valor,
        String status,
        String observacao
) {
}
