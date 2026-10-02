package br.com.w4solution.controle_instalacao.dto.cobranca;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CobrancaAcompanhamentoDTO(
        @Size(max = 100, message = "Status não pode exceder 100 caracteres")
        String status,

        @PositiveOrZero(message = "Valor deve ser maior ou igual a zero")
        BigDecimal valor,

        @PositiveOrZero(message = "Valor pago deve ser maior ou igual a zero")
        BigDecimal valorPago,

        LocalDate dataPromessa,

        @NotBlank(message = "Informe o que foi realizado no acompanhamento.")
        @Size(max = 2000, message = "Observação não pode exceder 2000 caracteres")
        String observacao
) {
}
