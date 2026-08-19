package br.com.w4solution.controle_instalacao.dto.whatsapp;

import br.com.w4solution.controle_instalacao.domain.whatsapp.WhatsappMensagem;
import java.time.Instant;

public record WhatsappMensagemDTO(
        Long id, Long conversaId, boolean recebida, String texto, String atendente, Instant enviadaEm
) {
    public WhatsappMensagemDTO(WhatsappMensagem m) {
        this(m.getId(), m.getConversa().getId(), m.isRecebida(), m.getTexto(),
                m.getUsuario() == null ? null : m.getUsuario().getUsuario(), m.getEnviadaEm());
    }
}
