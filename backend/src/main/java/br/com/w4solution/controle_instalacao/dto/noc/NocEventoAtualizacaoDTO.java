package br.com.w4solution.controle_instalacao.dto.noc;

import java.time.LocalDateTime;

public record NocEventoAtualizacaoDTO(
        String statusProblema,
        LocalDateTime fim,
        String observacao
) {
}
