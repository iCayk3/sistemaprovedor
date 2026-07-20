package br.com.w4solution.controle_instalacao.dto.cobranca;

import br.com.w4solution.controle_instalacao.domain.cobranca.Cobranca;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record CobrancaDTO(
        Long id,
        String protocolo,
        String acao,
        Integer codigoCliente,
        String cliente,
        String grupoCliente,
        LocalDate data,
        LocalDate dataPromessa,
        BigDecimal valor,
        String status,
        String observacao,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm,
        LocalDateTime fechadoEm,
        String criadoPor,
        String atualizadoPor,
        String ultimoUsuario,
        Boolean editavel,
        Boolean excluida,
        LocalDateTime excluidoEm,
        String excluidoPor,
        String motivoExclusao,
        List<CobrancaHistoricoDTO> historico
) {
    private static final Map<String, String> GRUPOS_CLIENTE = Map.ofEntries(
            Map.entry("9", "PADRAO"),
            Map.entry("10", "SJP"),
            Map.entry("11", "PMV"),
            Map.entry("13", "STN"),
            Map.entry("15", "QT"),
            Map.entry("16", "BV"),
            Map.entry("17", "SEM COBRANCA"),
            Map.entry("26", "MB"),
            Map.entry("32", "MRC"),
            Map.entry("33", "MRP"),
            Map.entry("34", "SAL"),
            Map.entry("36", "RADIO - PIRABAS"),
            Map.entry("40", "TESTE"),
            Map.entry("41", "PRE"),
            Map.entry("42", "CON"),
            Map.entry("43", "SOL")
    );

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
                grupoCliente(cobranca.getGrupoCliente()),
                cobranca.getData(),
                cobranca.getDataPromessa(),
                cobranca.getValor(),
                cobranca.getStatus(),
                cobranca.getObservacao(),
                cobranca.getCriadoEm(),
                cobranca.getAtualizadoEm(),
                cobranca.getFechadoEm(),
                cobranca.getCriadoPor(),
                cobranca.getAtualizadoPor(),
                ultimoUsuario(cobranca, historico),
                isEditavel(cobranca.getStatus()),
                Boolean.TRUE.equals(cobranca.getExcluida()),
                cobranca.getExcluidoEm(),
                cobranca.getExcluidoPor(),
                cobranca.getMotivoExclusao(),
                historico
        );
    }

    private static String ultimoUsuario(Cobranca cobranca, List<CobrancaHistoricoDTO> historico) {
        if (historico != null && !historico.isEmpty() && historico.get(0).usuario() != null) {
            return historico.get(0).usuario();
        }
        if (cobranca.getAtualizadoPor() != null && !cobranca.getAtualizadoPor().isBlank()) {
            return cobranca.getAtualizadoPor();
        }
        return cobranca.getCriadoPor();
    }

    private static String grupoCliente(String grupo) {
        if (grupo == null || grupo.isBlank()) {
            return grupo;
        }
        return GRUPOS_CLIENTE.getOrDefault(grupo.trim(), grupo);
    }

    private static boolean isEditavel(String status) {
        if (status == null) {
            return true;
        }
        String normalizado = status.trim().toUpperCase();
        return !normalizado.equals("PAGO") && !normalizado.equals("FECHADO") && !normalizado.equals("CANCELADO");
    }
}
