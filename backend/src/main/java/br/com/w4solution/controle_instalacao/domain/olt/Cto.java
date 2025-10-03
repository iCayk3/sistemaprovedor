package br.com.w4solution.controle_instalacao.domain.olt;

import br.com.w4solution.controle_instalacao.domain.registro.Registro;
import br.com.w4solution.controle_instalacao.dto.olt.AtualizarCtoDto;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "ctos")
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode(of = "id")
@Getter
@Setter
public class Cto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true)
    private String nomeCto;
    @OneToMany(mappedBy = "cto", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private List<Porta> portas;
    @ManyToOne
    private Olt olt;
    private String lat;
    private String longi;


    @Override
    public String toString() {
        return "nomeCto='" + nomeCto;
    }

    public void atualizarDados(AtualizarCtoDto dados) {
        if(dados.label() != null){
            this.nomeCto = dados.label();
        }
        if(dados.lat() != null){
            this.lat = dados.lat();
        }
        if(dados.longi() != null){
            this.longi = dados.longi();
        }
        if(dados.portas() != null){
            var totalPortas = portas.size();
            if(totalPortas < dados.portas()){
                var iteracoes = dados.portas() - totalPortas;
                for (var i = 0; i < iteracoes; i++){
                    portas.add(new Porta(null, portas.size() + 1, null, null, this));
                }
            }else {
                var iteracoes = totalPortas - dados.portas();
                for (var i = totalPortas; i > dados.portas(); i--){
                    portas.get(i - 1).setCto(null);
                }
            }
        }
    }
}
