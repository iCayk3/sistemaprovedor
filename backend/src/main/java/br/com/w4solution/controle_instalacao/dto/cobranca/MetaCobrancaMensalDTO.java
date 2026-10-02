package br.com.w4solution.controle_instalacao.dto.cobranca;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record MetaCobrancaMensalDTO(
        LocalDate mesReferencia,
        @PositiveOrZero(message = "A meta de recebimento não pode ser negativa.")
        BigDecimal metaRecebimento,
        @PositiveOrZero(message = "A meta de recuperação não pode ser negativa.")
        @DecimalMax(value = "100.00", message = "A meta de recuperação deve estar entre 0 e 100%.")
        BigDecimal metaRecuperacao,
        @PositiveOrZero(message = "O limite de inadimplência não pode ser negativo.")
        @DecimalMax(value = "100.00", message = "O limite de inadimplência deve estar entre 0 e 100%.")
        BigDecimal limiteInadimplencia,
        @PositiveOrZero(message = "A meta de acordos não pode ser negativa.")
        Integer metaAcordos,
        LocalDateTime atualizadoEm,
        String atualizadoPor
) {
}
