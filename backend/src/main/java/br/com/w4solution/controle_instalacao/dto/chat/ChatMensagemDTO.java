package br.com.w4solution.controle_instalacao.dto.chat;

import br.com.w4solution.controle_instalacao.domain.chat.ChatMensagem;

import java.time.Instant;

public record ChatMensagemDTO(Long id, Long conversaId, Long autorId, String autor, String texto, Instant enviadaEm) {
    public ChatMensagemDTO(ChatMensagem mensagem) {
        this(mensagem.getId(), mensagem.getConversa().getId(), mensagem.getAutor().getId(),
                mensagem.getAutor().getUsuario(), mensagem.getTexto(), mensagem.getEnviadaEm());
    }
}
