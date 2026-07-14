package br.com.w4solution.controle_instalacao.dto.cobranca;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CobrancaAcompanhamentoDTO(
        String status,
        BigDecimal valor,
        LocalDate dataPromessa,
        String observacao
) {
}
