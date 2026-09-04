package br.com.w4solution.controle_instalacao.dto.rbx;

import java.time.LocalDateTime;

public record AtendimentoEncerramentoRbxDTO(
        Long causaId,
        String solucao,
        LocalDateTime dataHora
) {
}
