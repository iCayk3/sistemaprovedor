package br.com.w4solution.controle_instalacao.domain.ia;

import br.com.w4solution.controle_instalacao.domain.usuarios.Usuario;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "ia_conversas")
@Getter
@NoArgsConstructor
public class ConversaIa {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private CanalConversa canal;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ModoConversa modo;

    @Column(nullable = false, length = 120)
    private String titulo;

    @Column(nullable = false, updatable = false)
    private Instant criadaEm;

    @Column(nullable = false)
    private Instant atualizadaEm;

    public ConversaIa(Usuario usuario, ModoConversa modo) {
        this.usuario = usuario;
        this.modo = modo;
        this.canal = CanalConversa.WEB_INTERNO;
        this.titulo = modo == ModoConversa.ANALISE ? "Nova análise" : "Novo atendimento";
        this.criadaEm = Instant.now();
        this.atualizadaEm = criadaEm;
    }

    public void registrarMensagem(String primeiraMensagem) {
        if (titulo.startsWith("Novo ") && primeiraMensagem != null && !primeiraMensagem.isBlank()) {
            String normalizado = primeiraMensagem.replaceAll("\\s+", " ").trim();
            titulo = normalizado.substring(0, Math.min(normalizado.length(), 70));
        }
        atualizadaEm = Instant.now();
    }
}
