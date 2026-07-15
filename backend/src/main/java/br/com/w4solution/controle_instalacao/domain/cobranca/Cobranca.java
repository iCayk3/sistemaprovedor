package br.com.w4solution.controle_instalacao.domain.cobranca;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
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
@Table(name = "cobrancas")
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
    private String cliente;
    private String grupoCliente;
    private LocalDate data;
    private LocalDate dataPromessa;
    private BigDecimal valor;
    private String status;

    @Column(length = 2000)
    private String observacao;

    private LocalDateTime criadoEm = LocalDateTime.now();
    private LocalDateTime atualizadoEm;
    private LocalDateTime fechadoEm;
    private String criadoPor;
    private String atualizadoPor;
}
