package br.com.w4solution.controle_instalacao.repository.ia;

import br.com.w4solution.controle_instalacao.domain.ia.ConversaIa;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ConversaIaRepository extends JpaRepository<ConversaIa, Long> {
    List<ConversaIa> findByUsuarioIdOrderByAtualizadaEmDesc(Long usuarioId);
    Optional<ConversaIa> findByIdAndUsuarioId(Long id, Long usuarioId);
}
