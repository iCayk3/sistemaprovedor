package br.com.w4solution.controle_instalacao.domain.usuarios;

import br.com.w4solution.controle_instalacao.dto.usuarios.RedefinirSenhaDTO;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@Entity
@Getter
@Setter
@EqualsAndHashCode(of = "id")
@Table(name = "redefinirSenhas")
@AllArgsConstructor
@NoArgsConstructor
public class RedefinirSenha {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String usuario;
    private String senha;
    private Status status = Status.PENDENTE;

    public RedefinirSenha(RedefinirSenhaDTO dados) {
        this.usuario = dados.usuario();
        if(dados.senha().equals(dados.senhaNovamente()) && !dados.senha().isEmpty()){
            this.senha = new BCryptPasswordEncoder().encode(dados.senha());
        }else {
            throw new RuntimeException("Senhas nao sao iguais");
        }
    }
}
