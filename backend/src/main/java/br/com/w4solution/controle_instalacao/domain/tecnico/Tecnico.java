package br.com.w4solution.controle_instalacao.domain.tecnico;

import br.com.w4solution.controle_instalacao.dto.tecnico.EquipeDTO;
import br.com.w4solution.controle_instalacao.dto.tecnico.TecnicoDTO;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tecnicos")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode(of = "id")
public class Tecnico {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    private String nome;
    @ManyToOne
    private EquipeTecnica equipeTecnica;

    public Tecnico(TecnicoDTO dados){
        this.nome = dados.nome();
    }

    public Tecnico(TecnicoDTO t, EquipeTecnica equipeTecnica) {
        this.nome = t.nome();
        this.equipeTecnica = equipeTecnica;
    }

    @Override
    public String toString() {
        return this.nome;
    }
}
