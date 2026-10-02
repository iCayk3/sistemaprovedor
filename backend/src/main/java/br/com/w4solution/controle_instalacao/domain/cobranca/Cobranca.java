package br.com.w4solution.controle_instalacao.domain.cobranca;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "cobrancas", indexes = {
        @Index(name = "idx_cobrancas_codigo_cliente", columnList = "codigoCliente"),
        @Index(name = "idx_cobrancas_numero_contrato", columnList = "numeroContrato"),
        @Index(name = "idx_cobrancas_status_excluida", columnList = "status, excluida"),
        @Index(name = "idx_cobrancas_responsavel", columnList = "responsavel"),
        @Index(name = "idx_cobrancas_vencimento", columnList = "dataVencimento"),
        @Index(name = "idx_cobrancas_protocolo", columnList = "protocolo")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class Cobranca {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String protocolo;
    private String acao;
    private Integer codigoCliente;
    private String numeroContrato;
    private String documentoTitulo;
    private String atendimentoRbxNumero;
    private String atendimentoRbxProtocolo;
    private String statusIntegracaoRbx;

    @Column(length = 2000)
    private String erroIntegracaoRbx;

    private LocalDateTime abertoNoRbxEm;
    private LocalDateTime fechadoNoRbxEm;
    private Boolean geradaAutomaticamente = false;
    private String responsavel;
    private LocalDateTime capturadoEm;
    private Boolean notificacaoEncerramentoPendente = false;
    private LocalDateTime notificacaoEncerramentoEm;

    @Column(length = 2000)
    private String notificacaoEncerramentoMensagem;

    @Column(columnDefinition = "TEXT")
    private String solucaoRbxPreparada;
    private String cliente;
    private String grupoCliente;
    private LocalDate data;
    private LocalDate dataVencimento;
    private LocalDate dataPromessa;
    private BigDecimal valor;
    private BigDecimal valorPago;
    private String status;
    private String situacaoAtendimento;

    @Column(length = 2000)
    private String observacao;

    private LocalDateTime criadoEm = LocalDateTime.now();
    private LocalDateTime atualizadoEm;
    private LocalDateTime fechadoEm;
    private String criadoPor;
    private String atualizadoPor;
    private Boolean excluida = false;
    private LocalDateTime excluidoEm;
    private String excluidoPor;

    @Column(length = 2000)
    private String motivoExclusao;
}
