package br.com.w4solution.controle_instalacao.domain.registro;

import br.com.w4solution.controle_instalacao.domain.cliente.Cliente;
import br.com.w4solution.controle_instalacao.domain.olt.Cto;
import br.com.w4solution.controle_instalacao.domain.olt.Olt;
import br.com.w4solution.controle_instalacao.domain.olt.Porta;
import br.com.w4solution.controle_instalacao.domain.tecnico.EquipeTecnica;
import br.com.w4solution.controle_instalacao.dto.registro.AtualizarRegistroDTO;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Entity
@Table(name = "registros")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class Registro {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String clienteRegistro;
    private String oltRegistro;
    private String ctoRegistros;
    private String portaRegistro;
    private String equipeTecnicaRegistro;
    private LocalDate dataRegistro;
    private String procedimentoRegistro;
    private String ctoAntiga;
    private String localidade;
    private String observacao;
    private String login;
    private String mac;

    public Registro(String ctoAntiga, String localidade, String observacao) {
        this.ctoAntiga = ctoAntiga;
        this.localidade = localidade;
        this.observacao = observacao;
    }

    public Registro(String cliente, String equipeTecnica, LocalDate data, String procedimento, String ctoAntiga, String localidade, String observacao, String login, String mac){
        this.clienteRegistro = cliente;
        this.equipeTecnicaRegistro = equipeTecnica;
        this.dataRegistro = data;
        this.procedimentoRegistro = procedimento;
        this.ctoAntiga = ctoAntiga;
        this.localidade = localidade;
        this.observacao = observacao;
        this.login = login;
        this.mac = mac;
    }
}
