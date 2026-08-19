package br.com.w4solution.controle_instalacao.domain.chat;

import br.com.w4solution.controle_instalacao.domain.usuarios.Usuario;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "chat_participantes", uniqueConstraints =
        @UniqueConstraint(name = "uk_chat_participante", columnNames = {"conversa_id", "usuario_id"}))
@Getter
@NoArgsConstructor
public class ChatParticipante {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversa_id", nullable = false)
    private ChatConversa conversa;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;
    private Instant ultimoLidoEm;

    public ChatParticipante(ChatConversa conversa, Usuario usuario) {
        this.conversa = conversa;
        this.usuario = usuario;
        this.ultimoLidoEm = Instant.now();
    }

    public void marcarComoLida() {
        ultimoLidoEm = Instant.now();
    }
}
