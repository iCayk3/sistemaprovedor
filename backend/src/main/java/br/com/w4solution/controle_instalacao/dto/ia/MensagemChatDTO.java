package br.com.w4solution.controle_instalacao.dto.ia;

import br.com.w4solution.controle_instalacao.domain.ia.MensagemIa;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record MensagemChatDTO(
        String id,
        String conversationId,
        String role,
        List<Map<String, String>> parts,
        Instant createdAt,
        String status
) {
    public MensagemChatDTO(MensagemIa mensagem) {
        this(
                mensagem.getId().toString(),
                mensagem.getConversa().getId().toString(),
                mensagem.getPapel().name().toLowerCase(),
                List.of(Map.of("type", "text", "text", mensagem.getConteudo())),
                mensagem.getCriadaEm(),
                "sent"
        );
    }
}
