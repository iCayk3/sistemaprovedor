package br.com.w4solution.controle_instalacao.dto.cobranca;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record MetaCobrancaMensalDTO(
        LocalDate mesReferencia,
        BigDecimal metaRecebimento,
        BigDecimal metaRecuperacao,
        BigDecimal limiteInadimplencia,
        Integer metaAcordos,
        LocalDateTime atualizadoEm,
        String atualizadoPor
) {
}
