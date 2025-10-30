package br.com.w4solution.controle_instalacao.repository.usuarios;

import br.com.w4solution.controle_instalacao.domain.usuarios.RedefinirSenha;
import br.com.w4solution.controle_instalacao.domain.usuarios.Status;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RedefinirSenhaRepository extends JpaRepository<RedefinirSenha, Long> {
    List<RedefinirSenha> findAllByStatus(Status status);

    Optional<RedefinirSenha> findByUsuario(String usuario);
}
