package br.com.w4solution.controle_instalacao.dto.cobranca;

import br.com.w4solution.controle_instalacao.domain.cobranca.Cobranca;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CobrancaEncerramentoNotificacaoDTO(
        Long cobrancaId,
        String protocolo,
        String cliente,
        BigDecimal valorPago,
        String statusIntegracaoRbx,
        String mensagem,
        LocalDateTime encerradaEm
) {
    public CobrancaEncerramentoNotificacaoDTO(Cobranca cobranca) {
        this(cobranca.getId(), cobranca.getProtocolo(), cobranca.getCliente(), cobranca.getValorPago(),
                cobranca.getStatusIntegracaoRbx(), cobranca.getNotificacaoEncerramentoMensagem(),
                cobranca.getNotificacaoEncerramentoEm());
    }
}
