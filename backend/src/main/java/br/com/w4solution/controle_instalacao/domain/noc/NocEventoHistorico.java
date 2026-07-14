package br.com.w4solution.controle_instalacao.domain.noc;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "noc_eventos_historico")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class NocEventoHistorico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "noc_evento_id")
    private NocEvento evento;

    private String statusAnterior;
    private String statusNovo;
    private LocalDateTime fimAnterior;
    private LocalDateTime fimNovo;
    private String usuario;

    @Column(length = 2000)
    private String observacao;

    private LocalDateTime criadoEm = LocalDateTime.now();
}
