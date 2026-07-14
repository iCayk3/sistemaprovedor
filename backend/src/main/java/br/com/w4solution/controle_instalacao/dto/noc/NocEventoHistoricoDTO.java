package br.com.w4solution.controle_instalacao.dto.noc;

import br.com.w4solution.controle_instalacao.domain.noc.NocEventoHistorico;

import java.time.LocalDateTime;

public record NocEventoHistoricoDTO(
        Long id,
        String statusAnterior,
        String statusNovo,
        LocalDateTime fimAnterior,
        LocalDateTime fimNovo,
        String observacao,
        String usuario,
        LocalDateTime criadoEm
) {
    public NocEventoHistoricoDTO(NocEventoHistorico historico) {
        this(
                historico.getId(),
                historico.getStatusAnterior(),
                historico.getStatusNovo(),
                historico.getFimAnterior(),
                historico.getFimNovo(),
                historico.getObservacao(),
                historico.getUsuario(),
                historico.getCriadoEm()
        );
    }
}
