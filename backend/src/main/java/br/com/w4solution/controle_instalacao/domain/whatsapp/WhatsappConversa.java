package br.com.w4solution.controle_instalacao.domain.whatsapp;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "whatsapp_conversas", uniqueConstraints =
        @UniqueConstraint(name = "uk_whatsapp_instancia_numero", columnNames = {"instancia", "numero"}))
@Getter
@NoArgsConstructor
public class WhatsappConversa {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String instancia;
    @Column(nullable = false, length = 30)
    private String numero;
    private String nome;
    @Column(nullable = false)
    private Instant atualizadaEm = Instant.now();
    private Instant lidaEm = Instant.EPOCH;

    public WhatsappConversa(String instancia, String numero, String nome) {
        this.instancia = instancia;
        this.numero = numero;
        this.nome = nome;
    }

    public void atualizar(String nome) {
        if (nome != null && !nome.isBlank()) this.nome = nome;
        atualizadaEm = Instant.now();
    }

    public void marcarLida() {
        lidaEm = Instant.now();
    }
}
