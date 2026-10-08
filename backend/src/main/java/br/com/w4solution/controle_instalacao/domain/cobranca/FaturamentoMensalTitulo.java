package br.com.w4solution.controle_instalacao.domain.cobranca;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "faturamento_mensal_titulos",
        uniqueConstraints = @UniqueConstraint(name = "uk_faturamento_mes_documento", columnNames = {"mes_referencia", "documento"}),
        indexes = {
                @Index(name = "idx_faturamento_cliente_doc", columnList = "codigoCliente, documento"),
                @Index(name = "idx_faturamento_cobranca_id", columnList = "cobrancaId"),
                @Index(name = "idx_faturamento_mes_baixado", columnList = "mes_referencia, baixado")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class FaturamentoMensalTitulo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "mes_referencia", nullable = false)
    private LocalDate mesReferencia;
    private String codigoCliente;
    @Column(nullable = false)
    private LocalDate vencimento;
    @Column(nullable = false)
    private String documento;
    private String nomeCliente;
    private String grupo;
    private String banco;
    private String nossoNumero;
    private String numeroContrato;
    private Long cobrancaId;
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal valorFaturado;
    private String origem;
    private boolean baixado;
    @Column(name = "cancelado_rbx", nullable = false, columnDefinition = "boolean default false")
    private boolean canceladoRbx = false;
    @Column(precision = 15, scale = 2)
    private BigDecimal valorRecebido;
    private LocalDate dataBaixa;
    private LocalDateTime importadoEm;
    private String importadoPor;
    private LocalDateTime sincronizadoEm;
}
