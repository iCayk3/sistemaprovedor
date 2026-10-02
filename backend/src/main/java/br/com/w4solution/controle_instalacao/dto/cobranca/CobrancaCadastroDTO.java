package br.com.w4solution.controle_instalacao.dto.cobranca;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CobrancaCadastroDTO(
        @NotBlank(message = "A ação de cobrança é obrigatória")
        String acao,

        @NotNull(message = "O código do cliente é obrigatório")
        Integer codigoCliente,

        String numeroContrato,
        String documentoTitulo,
        String cliente,
        String grupoCliente,
        LocalDate data,
        LocalDate dataVencimento,
        LocalDate dataPromessa,
        BigDecimal valor,
        BigDecimal valorPago,
        String status,
        String observacao
) {
}
