package br.com.w4solution.controle_instalacao.dto.noc;

import br.com.w4solution.controle_instalacao.domain.noc.NocEvento;

import java.time.LocalDateTime;
import java.util.List;

public record NocEventoDTO(
        Long id,
        String protocolo,
        String origem,
        String tipoEvento,
        String tecnico,
        String cliente,
        String cidade,
        String bairro,
        LocalDateTime inicio,
        LocalDateTime fim,
        String statusProblema,
        String observacoes,
        LocalDateTime criadoEm,
        List<NocEventoHistoricoDTO> historico
) {
    public NocEventoDTO(NocEvento evento) {
        this(evento, List.of());
    }

    public NocEventoDTO(NocEvento evento, List<NocEventoHistoricoDTO> historico) {
        this(
                evento.getId(),
                evento.getProtocolo(),
                evento.getOrigem(),
                evento.getTipoEvento(),
                evento.getTecnico(),
                evento.getCliente(),
                evento.getCidade(),
                evento.getBairro(),
                evento.getInicio(),
                evento.getFim(),
                evento.getStatusProblema(),
                evento.getObservacoes(),
                evento.getCriadoEm(),
                historico
        );
    }
}
