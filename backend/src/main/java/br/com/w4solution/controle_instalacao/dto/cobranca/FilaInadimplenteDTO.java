package br.com.w4solution.controle_instalacao.dto.cobranca;

import java.math.BigDecimal;
import java.time.LocalDate;

public record FilaInadimplenteDTO(
        String codigoCliente,
        String cliente,
        int boletosVencidos,
        BigDecimal valorVencido,
        LocalDate vencimentoMaisAntigo,
        boolean atendimentoAberto
) {
}
