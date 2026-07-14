package br.com.w4solution.controle_instalacao.domain.noc;

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

import java.time.LocalDateTime;

@Entity
@Table(name = "noc_eventos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class NocEvento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String protocolo;
    private String origem;
    private String tipoEvento;
    private String tecnico;
    private String cliente;
    private String cidade;
    private String bairro;
    private LocalDateTime inicio;
    private LocalDateTime fim;
    private String statusProblema;
    private String observacoes;
    private LocalDateTime criadoEm = LocalDateTime.now();
}
