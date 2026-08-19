package br.com.w4solution.controle_instalacao.domain.ia;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "ia_mensagens", indexes = {
        @Index(name = "idx_ia_mensagens_conversa_data", columnList = "conversa_id,criada_em")
})
@Getter
@NoArgsConstructor
public class MensagemIa {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversa_id", nullable = false)
    private ConversaIa conversa;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PapelMensagem papel;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String conteudo;

    @Column(name = "criada_em", nullable = false, updatable = false)
    private Instant criadaEm;

    public MensagemIa(ConversaIa conversa, PapelMensagem papel, String conteudo) {
        this.conversa = conversa;
        this.papel = papel;
        this.conteudo = conteudo;
        this.criadaEm = Instant.now();
    }
}
