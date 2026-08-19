package br.com.w4solution.controle_instalacao.dto.chat;

import java.time.Instant;

public record ChatConversaDTO(
        Long id, Long usuarioId, String usuario, String ultimaMensagem,
        Instant atualizadaEm, long naoLidas
) {
}
