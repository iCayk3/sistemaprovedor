package br.com.w4solution.controle_instalacao.domain.cobranca;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "metas_cobranca_mensais", uniqueConstraints =
        @UniqueConstraint(name = "uk_meta_cobranca_mes", columnNames = "mes_referencia"))
@Getter
@Setter
@NoArgsConstructor
public class MetaCobrancaMensal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "mes_referencia", nullable = false)
    private LocalDate mesReferencia;

    @Column(precision = 15, scale = 2)
    private BigDecimal metaRecebimento;

    @Column(precision = 7, scale = 2)
    private BigDecimal metaRecuperacao;

    @Column(precision = 7, scale = 2)
    private BigDecimal limiteInadimplencia;

    private Integer metaAcordos;
    private LocalDateTime atualizadoEm;
    private String atualizadoPor;
}
