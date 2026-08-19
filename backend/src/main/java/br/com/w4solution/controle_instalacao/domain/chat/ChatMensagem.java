package br.com.w4solution.controle_instalacao.domain.chat;

import br.com.w4solution.controle_instalacao.domain.usuarios.Usuario;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "chat_mensagens", indexes =
        @Index(name = "idx_chat_mensagem_conversa_data", columnList = "conversa_id,enviada_em"))
@Getter
@NoArgsConstructor
public class ChatMensagem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversa_id", nullable = false)
    private ChatConversa conversa;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "autor_id", nullable = false)
    private Usuario autor;
    @Column(nullable = false, columnDefinition = "TEXT")
    private String texto;
    @Column(name = "enviada_em", nullable = false, updatable = false)
    private Instant enviadaEm = Instant.now();

    public ChatMensagem(ChatConversa conversa, Usuario autor, String texto) {
        this.conversa = conversa;
        this.autor = autor;
        this.texto = texto;
    }
}
