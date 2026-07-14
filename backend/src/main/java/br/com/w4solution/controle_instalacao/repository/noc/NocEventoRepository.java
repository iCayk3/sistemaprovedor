package br.com.w4solution.controle_instalacao.repository.noc;

import br.com.w4solution.controle_instalacao.domain.noc.NocEvento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface NocEventoRepository extends JpaRepository<NocEvento, Long> {
    Optional<NocEvento> findTopByProtocoloStartingWithOrderByProtocoloDesc(String prefix);
}
