package br.com.w4solution.controle_instalacao.domain.whatsapp;

import br.com.w4solution.controle_instalacao.domain.usuarios.Usuario;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "whatsapp_mensagens", indexes =
        @Index(name = "idx_whatsapp_mensagem_conversa_data", columnList = "conversa_id,enviada_em"))
@Getter
@NoArgsConstructor
public class WhatsappMensagem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversa_id")
    private WhatsappConversa conversa;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;
    @Column(unique = true)
    private String idExterno;
    @Column(nullable = false)
    private boolean recebida;
    @Column(nullable = false, columnDefinition = "TEXT")
    private String texto;
    @Column(name = "enviada_em", nullable = false)
    private Instant enviadaEm = Instant.now();

    public WhatsappMensagem(WhatsappConversa conversa, Usuario usuario, String idExterno, boolean recebida, String texto) {
        this.conversa = conversa;
        this.usuario = usuario;
        this.idExterno = idExterno;
        this.recebida = recebida;
        this.texto = texto;
    }
}
