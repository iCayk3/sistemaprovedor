package br.com.w4solution.controle_instalacao.repository.ia;

import br.com.w4solution.controle_instalacao.domain.ia.MensagemIa;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MensagemIaRepository extends JpaRepository<MensagemIa, Long> {
    List<MensagemIa> findByConversaIdOrderByCriadaEmAsc(Long conversaId);
}
