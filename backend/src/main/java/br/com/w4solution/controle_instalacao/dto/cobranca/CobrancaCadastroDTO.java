package br.com.w4solution.controle_instalacao.dto.cobranca;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CobrancaCadastroDTO(
        String acao,
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
