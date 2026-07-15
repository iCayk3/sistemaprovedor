package br.com.w4solution.controle_instalacao.domain.atividades;

import br.com.w4solution.controle_instalacao.dto.evento.CadastrarAtividadesDTO;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "atividades")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode(of = "id")
public class Atividade {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String evento;
    private String cliente;
    private LocalDate data;
    private String usuario;
    private String segmento;
    private Double valor;
    private String status;
    private Integer codigoCliente;
    private String grupoCliente;
    private String plano;
    private Double valorPlano;
    private LocalDateTime convertidoEm;
    private String convertidoPor;

    public Atividade(CadastrarAtividadesDTO atv, String usuario){
        this.evento = atv.evento();
        this.cliente = atv.cliente();
        this.data = atv.data();
        this.usuario = usuario;
        this.segmento = atv.segmento() != null ? atv.segmento() : "ATIVIDADE";
        this.valor = atv.valor();
        this.status = atv.status() != null ? atv.status() : ("LEAD".equalsIgnoreCase(this.segmento) ? "ABERTO" : null);
        this.codigoCliente = atv.codigoCliente();
        this.grupoCliente = atv.grupoCliente();
        this.plano = atv.plano();
        this.valorPlano = atv.valorPlano();
    }
}
