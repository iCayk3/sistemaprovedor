package br.com.w4solution.controle_instalacao.dto.cobranca;

import br.com.w4solution.controle_instalacao.domain.cobranca.CobrancaHistorico;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CobrancaHistoricoDTO(
        Long id,
        String statusAnterior,
        String statusNovo,
        BigDecimal valorAnterior,
        BigDecimal valorNovo,
        String observacao,
        String usuario,
        LocalDateTime criadoEm
) {
    public CobrancaHistoricoDTO(CobrancaHistorico historico) {
        this(
                historico.getId(),
                historico.getStatusAnterior(),
                historico.getStatusNovo(),
                historico.getValorAnterior(),
                historico.getValorNovo(),
                historico.getObservacao(),
                historico.getUsuario(),
                historico.getCriadoEm()
        );
    }
}
