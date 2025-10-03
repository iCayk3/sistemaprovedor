package br.com.w4solution.controle_instalacao.domain.atividades;

import br.com.w4solution.controle_instalacao.dto.evento.CadastrarAtividadesDTO;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

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

    public Atividade(CadastrarAtividadesDTO atv, String usuario){
        this.evento = atv.evento();
        this.cliente = atv.cliente();
        this.data = atv.data();
        this.usuario = usuario;
    }
}
