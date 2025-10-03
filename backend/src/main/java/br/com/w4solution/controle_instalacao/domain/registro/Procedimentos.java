package br.com.w4solution.controle_instalacao.domain.registro;

import br.com.w4solution.controle_instalacao.dto.registro.AtualizarProcedimentoDto;
import br.com.w4solution.controle_instalacao.dto.registro.CadastroProcedimentoDTO;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "procedimentos")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@EqualsAndHashCode(of = "id")
public class Procedimentos {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String procedimento;
    private String cor;
    private boolean ativo = true;

    public Procedimentos(CadastroProcedimentoDTO p){
        this.procedimento = p.procedimento();
        this.cor = p.cor();
    }

    public void atualizarProcedimento(AtualizarProcedimentoDto dados) {
        if(dados.procedimento() != null){
            this.procedimento = dados.procedimento();
        }
        if(dados.cor() != null){
            this.cor = dados.cor();
        }
    }
}
