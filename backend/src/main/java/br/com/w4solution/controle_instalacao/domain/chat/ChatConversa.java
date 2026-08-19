package br.com.w4solution.controle_instalacao.domain.chat;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "chat_conversas")
@Getter
@NoArgsConstructor
public class ChatConversa {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, updatable = false)
    private Instant criadaEm = Instant.now();
    @Column(nullable = false)
    private Instant atualizadaEm = Instant.now();

    public void atualizar() {
        atualizadaEm = Instant.now();
    }
}
