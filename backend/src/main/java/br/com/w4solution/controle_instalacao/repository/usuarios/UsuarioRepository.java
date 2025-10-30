package br.com.w4solution.controle_instalacao.repository.usuarios;

import br.com.w4solution.controle_instalacao.domain.usuarios.Status;
import br.com.w4solution.controle_instalacao.domain.usuarios.UserRole;
import br.com.w4solution.controle_instalacao.domain.usuarios.Usuario;
import br.com.w4solution.controle_instalacao.dto.usuarios.UsuarioDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByUsuario(String subject);

    List<Usuario> findAllByStatus(Status status);

    List<Usuario> findAllByStatusNot(Status status);

    @Query("SELECT u FROM Usuario u WHERE str(u.permissao) LIKE %:roleFragment%")
    List<Usuario> encontrarUsuariosPorFragmento(String roleFragment);

    Optional<Usuario> findByUsuarioAndStatus(String usuario, Status status);
}
