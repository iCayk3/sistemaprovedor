package br.com.w4solution.controle_instalacao.dto.cobranca;

import br.com.w4solution.controle_instalacao.domain.cobranca.Cobranca;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record CobrancaDTO(
        Long id,
        String protocolo,
        String acao,
        Integer codigoCliente,
        String cliente,
        LocalDate data,
        LocalDate dataPromessa,
        BigDecimal valor,
        String status,
        String observacao,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm,
        LocalDateTime fechadoEm,
        Boolean editavel,
        List<CobrancaHistoricoDTO> historico
) {
    public CobrancaDTO(Cobranca cobranca) {
        this(cobranca, List.of());
    }

    public CobrancaDTO(Cobranca cobranca, List<CobrancaHistoricoDTO> historico) {
        this(
                cobranca.getId(),
                cobranca.getProtocolo(),
                cobranca.getAcao(),
                cobranca.getCodigoCliente(),
                cobranca.getCliente(),
                cobranca.getData(),
                cobranca.getDataPromessa(),
                cobranca.getValor(),
                cobranca.getStatus(),
                cobranca.getObservacao(),
                cobranca.getCriadoEm(),
                cobranca.getAtualizadoEm(),
                cobranca.getFechadoEm(),
                isEditavel(cobranca.getStatus()),
                historico
        );
    }

    private static boolean isEditavel(String status) {
        if (status == null) {
            return true;
        }
        String normalizado = status.trim().toUpperCase();
        return !normalizado.equals("PAGO") && !normalizado.equals("FECHADO") && !normalizado.equals("CANCELADO");
    }
}
