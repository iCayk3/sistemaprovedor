package br.com.w4solution.controle_instalacao.dto.ia;

import br.com.w4solution.controle_instalacao.domain.ia.ConversaIa;

import java.time.Instant;

public record ConversaIaDTO(
        String id,
        String title,
        String subtitle,
        Instant lastMessageAt
) {
    public ConversaIaDTO(ConversaIa conversa) {
        this(
                conversa.getId().toString(),
                conversa.getTitulo(),
                conversa.getModo() == null ? "" : conversa.getModo().name(),
                conversa.getAtualizadaEm()
        );
    }
}
